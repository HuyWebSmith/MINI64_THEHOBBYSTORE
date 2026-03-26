import PageBreadcrumb from "../../components/admin_component/common/PageBreadCrumb";
import PageMeta from "../../components/admin_component/common/PageMeta";
import EntityManagementPanel from "../../components/admin_component/catalog/EntityManagementPanel";

const apiUrl = import.meta.env.VITE_API_URL;

export default function BrandManagement() {
  return (
    <>
      <PageMeta
        title="Quản lý thương hiệu | Mini64 Hobby Store"
        description="Trang quản trị thêm, sửa, xóa thương hiệu sản phẩm"
      />
      <PageBreadcrumb pageTitle="Quản lý thương hiệu" />

      <EntityManagementPanel
        title="Quản lý hãng mô hình"
        description="Thêm, cập nhật và xóa các hãng sản xuất mô hình (như MiniGT, BBR, Hot Wheels) để gắn vào sản phẩm."
        entityLabel="Thương hiệu"
        entityLabelPlural="Thương hiệu"
        fetchUrl={`${apiUrl}/api/brand/get-all`}
        createUrl={`${apiUrl}/api/brand/create`}
        updateUrlBase={`${apiUrl}/api/brand/update`}
        deleteUrlBase={`${apiUrl}/api/brand/delete`}
        mediaFieldKey="logo"
        mediaFieldLabel="Logo hãng"
      />
    </>
  );
}
