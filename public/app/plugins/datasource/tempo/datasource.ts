import {
  ArrayVector,
  DataFrame,
  DataQuery,
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  Field,
  FieldType,
  MutableDataFrame,
} from '@grafana/data';
import { DataSourceWithBackend } from '@grafana/runtime';
import { TraceToLogsData, TraceToLogsOptions } from 'app/core/components/TraceToLogsSettings';
import { getDatasourceSrv } from 'app/features/plugins/datasource_srv';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export type TempoQuery = {
  query: string;
  // Query to find list of traces, e.g., via Loki
  linkedQuery?: DataQuery;
} & DataQuery;

export class TempoDatasource extends DataSourceWithBackend<TempoQuery, TraceToLogsData> {
  tracesToLogs: TraceToLogsOptions;
  linkedDatasource: DataSourceApi;
  constructor(instanceSettings: DataSourceInstanceSettings<TraceToLogsData>) {
    super(instanceSettings);
    this.tracesToLogs = instanceSettings.jsonData.tracesToLogs || {};
    if (this.tracesToLogs.datasourceUid) {
      this.linkDatasource();
    }
  }

  async linkDatasource() {
    const dsSrv = getDatasourceSrv();
    this.linkedDatasource = await dsSrv.get(this.tracesToLogs.datasourceUid);
  }

  query(options: DataQueryRequest<TempoQuery>): Observable<DataQueryResponse> {
    console.log('querying from datasource', options);
    // If there is a linked query, run that instead. This is used to provide a list of traces
    if (options.targets.some((t) => t.linkedQuery) && this.linkedDatasource) {
      // Wrap linked query into a data request
      const linkedQuery = options.targets.find((t) => t.linkedQuery)?.linkedQuery;
      const linkedRequest: DataQueryRequest = { ...options, targets: [linkedQuery!] };
      return this.linkedDatasource.query(linkedRequest);
    }

    return super.query(options).pipe(
      map((response) => {
        if (response.error) {
          return response;
        }

        // We need to parse some of the fields which contain stringified json.
        // Seems like we can't just map the values as the frame we got from backend has some default processing
        // and will stringify the json back when we try to set it. So we create a new field and swap it instead.
        const frame: DataFrame = response.data[0];

        if (!frame) {
          return emptyDataQueryResponse;
        }

        for (const fieldName of ['serviceTags', 'logs', 'tags']) {
          const field = frame.fields.find((f) => f.name === fieldName);
          if (field) {
            const fieldIndex = frame.fields.indexOf(field);
            const values = new ArrayVector();
            const newField: Field = {
              ...field,
              values,
              type: FieldType.other,
            };

            for (let i = 0; i < field.values.length; i++) {
              const value = field.values.get(i);
              values.set(i, value === '' ? undefined : JSON.parse(value));
            }
            frame.fields[fieldIndex] = newField;
          }
        }

        return response;
      })
    );
  }

  async testDatasource(): Promise<any> {
    const response = await super.query({ targets: [{ query: '', refId: 'A' }] } as any).toPromise();

    if (!response.error?.message?.startsWith('failed to get trace')) {
      return { status: 'error', message: 'Data source is not working' };
    }

    return { status: 'success', message: 'Data source is working' };
  }

  getQueryDisplayText(query: TempoQuery) {
    return query.query;
  }
}

const emptyDataQueryResponse = {
  data: [
    new MutableDataFrame({
      fields: [
        {
          name: 'trace',
          type: FieldType.trace,
          values: [],
        },
      ],
      meta: {
        preferredVisualisationType: 'trace',
      },
    }),
  ],
};
