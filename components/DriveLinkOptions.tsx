import Image from "next/image";
import googledriveLogo from "@/public/googledrive_logo.svg";
import LinkSearch from "@/components/LinkSearch";

const DriveLinkOptions = () => {
  return (
    <div className="pt-20 flex items-center gap-25">
      <div className="bg-white rounded-xl p-10 flex flex-col gap-15 shadow-[0_4px_25px_2px_rgba(0,0,0,0.08)]">
        <Image src={googledriveLogo} alt="" className="w-75 mx-auto" />
        <LinkSearch />
      </div>
    </div>
  );
};

export default DriveLinkOptions;
