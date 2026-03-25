import EcommerceMetrics from "../../components/admin_component/auth/SignUpForm";
import MonthlySalesChart from "../../components/admin_component/ecommerce/MonthlySalesChart";
import StatisticsChart from "../../components/admin_component/ecommerce/StatisticsChart";
import MonthlyTarget from "../../components/admin_component/ecommerce/MonthlyTarget";
import RecentOrders from "../../components/admin_component/ecommerce/RecentOrders";
import DemographicCard from "../../components/admin_component/ecommerce/DemographicCard";
import PageMeta from "../../components/admin_component/common/PageMeta";

export default function Home() {
  return (
    <>
      <PageMeta
        title="React.js Ecommerce Dashboard | TailAdmin - React.js Admin Dashboard Template"
        description="This is React.js Ecommerce Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <EcommerceMetrics />

          <MonthlySalesChart />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <MonthlyTarget />
        </div>

        <div className="col-span-12">
          <StatisticsChart />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <DemographicCard />
        </div>

        <div className="col-span-12 xl:col-span-7">
          <RecentOrders />
        </div>
      </div>
    </>
  );
}
