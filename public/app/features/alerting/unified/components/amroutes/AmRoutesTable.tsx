import React, { FC, useCallback, useEffect, useState } from 'react';
import { Button, HorizontalGroup, IconButton } from '@grafana/ui';
import { AmRouteReceiver, FormAmRoute } from '../../types/amroutes';
import { collapseItem, expandItem, prepareItems } from '../../utils/dynamicTable';
import { AlertLabels } from '../AlertLabels';
import { DynamicTable, DynamicTableColumnProps, DynamicTableItemProps } from '../DynamicTable';
import { AmRoutesExpandedForm } from './AmRoutesExpandedForm';
import { AmRoutesExpandedRead } from './AmRoutesExpandedRead';

export interface AmRoutesTableProps {
  isAddMode: boolean;
  onChange: (routes: FormAmRoute[]) => void;
  receivers: AmRouteReceiver[];
  routes: FormAmRoute[];
}

type RouteTableColumnProps = DynamicTableColumnProps<FormAmRoute>;
type RouteTableItemProps = DynamicTableItemProps<FormAmRoute>;

export const AmRoutesTable: FC<AmRoutesTableProps> = ({ isAddMode, onChange, receivers, routes }) => {
  const [items, setItems] = useState<RouteTableItemProps[]>([]);

  const getRenderEditExpandedContent = useCallback(
    // eslint-disable-next-line react/display-name
    (item: RouteTableItemProps, index: number) => () => (
      <AmRoutesExpandedForm
        onCancel={() => setItems((items) => expandItem(items, item))}
        onSave={(data) => {
          const newRoutes = [...routes];

          newRoutes[index] = {
            ...newRoutes[index],
            ...data,
          };

          setItems((items) => collapseItem(items, item));

          onChange(newRoutes);
        }}
        receivers={receivers}
        routes={item.data}
      />
    ),
    [onChange, receivers, routes]
  );

  const cols: RouteTableColumnProps[] = [
    {
      id: 'matchingCriteria',
      label: 'Matching criteria',
      // eslint-disable-next-line react/display-name
      renderCell: (item) => (
        <AlertLabels
          labels={item.data.matchers.reduce(
            (acc, matcher) => ({
              ...acc,
              [matcher.label]: matcher.value,
            }),
            {}
          )}
        />
      ),
      size: 10,
    },
    {
      id: 'groupBy',
      label: 'Group by',
      renderCell: (item) => item.data.groupBy.join(', ') || '-',
      size: 5,
    },
    {
      id: 'receiverChannel',
      label: 'Receiver channel',
      renderCell: (item) => item.data.receiver || '-',
      size: 5,
    },
    {
      id: 'actions',
      label: 'Actions',
      // eslint-disable-next-line react/display-name
      renderCell: (item, index) => {
        if (item.renderExpandedContent) {
          return null;
        }

        const expandWithCustomContent = () =>
          setItems((items) => expandItem(items, item, getRenderEditExpandedContent(item, index)));

        return (
          <HorizontalGroup>
            <Button icon="pen" onClick={expandWithCustomContent} size="sm" type="button" variant="secondary">
              Edit
            </Button>
            <IconButton
              name="trash-alt"
              onClick={() => {
                const newRoutes = [...routes];

                newRoutes.splice(index, 1);

                onChange(newRoutes);
              }}
              type="button"
            />
          </HorizontalGroup>
        );
      },
      size: '100px',
    },
  ];

  useEffect(() => {
    const items = prepareItems(routes).map((item, index, arr) => {
      if (isAddMode && index === arr.length - 1) {
        return {
          ...item,
          isExpanded: true,
          renderExpandedContent: getRenderEditExpandedContent(item, index),
        };
      }

      return {
        ...item,
        isExpanded: false,
        renderExpandedContent: undefined,
      };
    });

    setItems(items);
  }, [routes, getRenderEditExpandedContent, isAddMode]);

  return (
    <DynamicTable
      cols={cols}
      isExpandable={true}
      items={items}
      onCollapse={(item: RouteTableItemProps) => setItems((items) => collapseItem(items, item))}
      onExpand={(item: RouteTableItemProps) => setItems((items) => expandItem(items, item))}
      renderExpandedContent={(item: RouteTableItemProps, index) => (
        <AmRoutesExpandedRead
          onChange={(data) => {
            const newRoutes = [...routes];

            newRoutes[index] = {
              ...item.data,
              ...data,
            };

            onChange(newRoutes);
          }}
          receivers={receivers}
          routes={item.data}
        />
      )}
    />
  );
};
