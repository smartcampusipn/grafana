import { DataQuery, DataSourceApi, ExploreQueryFieldProps } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { getDataSourceSrv } from '@grafana/runtime';
import { LegacyForms } from '@grafana/ui';
import { TraceToLogsData, TraceToLogsOptions } from 'app/core/components/TraceToLogsSettings';
import React from 'react';
import { LokiQueryField } from '../loki/components/LokiQueryField';
import { TempoDatasource, TempoQuery } from './datasource';

type Props = ExploreQueryFieldProps<TempoDatasource, TempoQuery>;

interface State {
  linkedDatasource?: DataSourceApi;
}
export class TempoQueryField extends React.PureComponent<Props, State> {
  state = {
    linkedQueryField: undefined,
    linkedDatasource: undefined,
  };
  linkedQuery: DataQuery;
  constructor(props: Props) {
    super(props);
    this.linkedQuery = { refId: 'linked' };
  }

  async componentDidMount() {
    const { datasource } = this.props;
    // Find query field from linked datasource
    const instanceSettings: TraceToLogsData = datasource.meta.jsonData || {};
    const tracesToLogsOptions: TraceToLogsOptions = instanceSettings.tracesToLogs || {};
    const linkedDatasourceUid = tracesToLogsOptions.datasourceUid;
    const dsSrv = getDataSourceSrv();
    const linkedDatasource = await dsSrv.get(linkedDatasourceUid);
    this.setState({
      linkedDatasource,
    });
  }

  onChangeLinkedQuery = (value: DataQuery) => {
    const { query, onChange } = this.props;
    this.linkedQuery = value;
    onChange({
      ...query,
      linkedQuery: this.linkedQuery,
    });
  };

  onRunLinkedQuery = () => {
    console.log('running query', this.linkedQuery);
    this.props.onRunQuery();
  };

  render() {
    const { query, onChange, range } = this.props;
    const { linkedDatasource } = this.state;

    const absoluteTimeRange = { from: range!.from!.valueOf(), to: range!.to!.valueOf() }; // Range here is never optional

    return (
      <>
        <LegacyForms.FormField
          label="Trace ID"
          labelWidth={4}
          inputEl={
            <div className="slate-query-field__wrapper">
              <div className="slate-query-field" aria-label={selectors.components.QueryField.container}>
                <input
                  style={{ width: '100%' }}
                  value={query.query || ''}
                  onChange={(e) =>
                    onChange({
                      ...query,
                      query: e.currentTarget.value,
                    })
                  }
                />
              </div>
            </div>
          }
        />
        {linkedDatasource ? (
          <LokiQueryField
            datasource={linkedDatasource!}
            onChange={this.onChangeLinkedQuery}
            onRunQuery={this.onRunLinkedQuery}
            query={this.linkedQuery as any}
            history={[]}
            absoluteRange={absoluteTimeRange}
          />
        ) : null}
      </>
    );
  }
}
