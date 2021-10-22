import React, { FC } from 'react';
import SideMenuDropDown from './SideMenuDropDown';
import { Icon } from '@grafana/ui';
import { NavModelItem, textUtil } from '@grafana/data';

export interface Props {
  link: NavModelItem;
  onClick?: () => void;
}

const TopSectionItem: FC<Props> = ({ link, onClick }) => {
  const sanitizedUrl = textUtil.sanitizeAngularInterpolation(link.url ?? '');
  return (
    <div className="sidemenu-item dropdown">
      <a className="sidemenu-link" href={sanitizedUrl} target={link.target} onClick={onClick}>
        <span className="icon-circle sidemenu-icon">
          {link.icon && <Icon name={link.icon as any} size="xl" />}
          {link.img && <img src={link.img} />}
        </span>
      </a>
      <SideMenuDropDown link={link} onHeaderClick={onClick} />
    </div>
  );
};

export default TopSectionItem;
