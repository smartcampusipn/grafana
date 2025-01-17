import React from 'react';

import { SelectableValue } from '@grafana/data';
import { EditorField, EditorRow, Select } from '@grafana/ui';

import { SELECTORS } from '../../constants';
import CloudMonitoringDatasource from '../../datasource';
import { SLOQuery } from '../../types';

export interface Props {
  refId: string;
  onChange: (query: SLOQuery) => void;
  query: SLOQuery;
  templateVariableOptions: Array<SelectableValue<string>>;
  datasource: CloudMonitoringDatasource;
}

export const Selector: React.FC<Props> = ({ refId, query, templateVariableOptions, onChange, datasource }) => {
  return (
    <EditorRow>
      <EditorField label="Selector" htmlFor={`${refId}-slo-selector`}>
        <Select
          inputId={`${refId}-slo-selector`}
          width="auto"
          allowCustomValue
          value={[...SELECTORS, ...templateVariableOptions].find((s) => s.value === query?.selectorName ?? '')}
          options={[
            {
              label: 'Template Variables',
              options: templateVariableOptions,
            },
            ...SELECTORS,
          ]}
          onChange={({ value: selectorName }) => onChange({ ...query, selectorName: selectorName ?? '' })}
        />
      </EditorField>
    </EditorRow>
  );
};
