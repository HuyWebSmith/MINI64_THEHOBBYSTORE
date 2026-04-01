import React from "react";
import { Cloudinary } from "@cloudinary/url-gen";
import { auto } from "@cloudinary/url-gen/actions/resize";
import { autoGravity } from "@cloudinary/url-gen/qualifiers/gravity";
import { AdvancedImage, placeholder } from "@cloudinary/react";

const ImageDisplay = ({ publicId }: { publicId: string }) => {
  const cld = new Cloudinary({
    cloud: { cloudName: "dwrc3mfq0" },
  });

  const myImage = cld
    .image(publicId)
    .format("auto")
    .quality("auto")
    .resize(auto().gravity(autoGravity()).width(500).height(500)); // Tự động nhận diện chủ thể để crop vào giữa

  return (
    <div style={{ maxWidth: "500px", margin: "20px auto" }}>
      <h3>Ảnh của bạn sau khi xử lý:</h3>

      <AdvancedImage
        cldImg={myImage}
        plugins={[placeholder({ mode: "blur" })]}
      />
    </div>
  );
};

export default ImageDisplay;
