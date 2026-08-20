import RouteErrorBoundary from "../components/error/RouteErrorBoundary";
import { Tabs } from "@mantine/core";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { usePartner } from "../lib/hooks";

export default function PartnerSettingsLayout() {
  const navigate = useNavigate();
  const { user } = usePartner();

  return (
    <div className="p-3">
      <div className="p-4 space-y-3 h-full">
        <h4 className="text-3xl">{user?.user.firstName}'s settings</h4>
      </div>
      <Tabs onChange={(url) => navigate(url!)}>
        <Tabs.List>
          <Tabs.Tab value="/partner/settings">
            <NavLink to={"/partner/settings"}>General</NavLink>
          </Tabs.Tab>
          <Tabs.Tab value="/partner/settings/account">
            <NavLink to={"/partner/settings/account"}>Account</NavLink>
          </Tabs.Tab>
        </Tabs.List>
        <div className="flex w-full justify-center items-center">
          <RouteErrorBoundary>
            <Outlet />
          </RouteErrorBoundary>
        </div>
      </Tabs>
    </div>
  );
}
