import PageBreadcrumb from "../../components/admin_component/common/PageBreadCrumb";
import ComponentCard from "../../components/admin_component/common/ComponentCard";
import PageMeta from "../../components/admin_component/common/PageMeta";
import ProductTable from "../../components/admin_component/products/ProductTable";

export default function ProductManagement() {
  return (
    <>
      <PageMeta
        title="Quản lý sản phẩm | Mini64 Hobby Store"
        description="Trang quản lý sản phẩm cho Admin"
      />
      <PageBreadcrumb pageTitle="Product Management" />

      <div className="space-y-6">
        <ComponentCard
          title="Danh sách sản phẩm"
          /* Huy có thể thêm nút Add Product ở đây nếu ComponentCard hỗ trợ custom header */
        >
          <div className="mb-4 flex justify-end">
            <button className="flex justify-center rounded bg-primary px-6 py-2 font-medium text-gray hover:bg-opacity-90">
              Thêm sản phẩm
            </button>
          </div>
          <ProductTable />
        </ComponentCard>
      </div>
    </>
  );
}
