import PageBreadcrumb from "../../components/admin_component/common/PageBreadCrumb";
import DefaultInputs from "../../components/admin_component/form/form-elements/DefaultInputs";
import InputGroup from "../../components/admin_component/form/form-elements/InputGroup";
import DropzoneComponent from "../../components/admin_component/form/form-elements/DropZone";
import CheckboxComponents from "../../components/admin_component/form/form-elements/CheckboxComponents";
import RadioButtons from "../../components/admin_component/form/form-elements/RadioButtons";
import ToggleSwitch from "../../components/admin_component/form/form-elements/ToggleSwitch";
import FileInputExample from "../../components/admin_component/form/form-elements/FileInputExample";
import SelectInputs from "../../components/admin_component/form/form-elements/SelectInputs";
import TextAreaInput from "../../components/admin_component/form/form-elements/TextAreaInput";
import InputStates from "../../components/admin_component/form/form-elements/InputStates";
import PageMeta from "../../components/admin_component/common/PageMeta";

export default function FormElements() {
  return (
    <div>
      <PageMeta
        title="React.js Form Elements Dashboard | TailAdmin - React.js Admin Dashboard Template"
        description="This is React.js Form Elements  Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Form Elements" />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <DefaultInputs />
          <SelectInputs />
          <TextAreaInput />
          <InputStates />
        </div>
        <div className="space-y-6">
          <InputGroup />
          <FileInputExample />
          <CheckboxComponents />
          <RadioButtons />
          <ToggleSwitch />
          <DropzoneComponent />
        </div>
      </div>
    </div>
  );
}
