import React from 'react'
import DashboardLayoutWrapper from './components/DashboardLayoutWrapper';

function layout({
    children,
  }: {
    children: React.ReactNode;
  }) {
  return <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>;
}

export default layout