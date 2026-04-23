import Image from "next/image";

import logo from "@/public/zip_drive_logo.svg";
import DriveLinkOptions from "@/components/DriveLinkOptions";

const Dashboard = () => {
  return (
    <div className="px-20 pt-50 flex flex-col gap-10 justify-center">
      <div className="flex gap-5 items-center justify-center">
        <div>
          <Image src={logo} alt="" className="w-12" />
        </div>
        <span className="font-extrabold text-3xl">
          <span className="text-brand-orange">Zip</span>{" "}
          <span className="text-black">Drive</span>
        </span>
      </div>
      <div className="text-center">
        <p className="w-265 mx-auto text-xl leading-8">
          A simple online tool that compresses images directly from Google Drive
          and OneDrive. You can use public links for free without signing up.
          For private files, just log in or create an account to securely access
          and compress your images.
        </p>
      </div>
      <div className="flex items-center justify-center">
        <DriveLinkOptions />
      </div>
    </div>
  );
};

export default Dashboard;
