import PageBreadcrumb from "../../components/admin_component/common/PageBreadCrumb";
import PageMeta from "../../components/admin_component/common/PageMeta";
import EntityManagementPanel from "../../components/admin_component/catalog/EntityManagementPanel";

const apiUrl = import.meta.env.VITE_API_URL;

export default function BrandManagement() {
  return (
    <>
      <PageMeta
        title="Quan ly thuong hieu | Mini64 Hobby Store"
        description="Trang admin them, sua, xoa thuong hieu"
      />
      <PageBreadcrumb pageTitle="Brand Management" />
      <EntityManagementPanel
        title="Quan ly thuong hieu"
        description="Them, cap nhat va xoa thuong hieu de gan vao san pham."
        entityLabel="Brand"
        entityLabelPlural="Brands"
        fetchUrl={`${apiUrl}/api/brand/get-all`}
        createUrl={`${apiUrl}/api/brand/create`}
        updateUrlBase={`${apiUrl}/api/brand/update`}
        deleteUrlBase={`${apiUrl}/api/brand/delete`}
        mediaFieldKey="logo"
        mediaFieldLabel="Logo"
      />
    </>
  );
}
