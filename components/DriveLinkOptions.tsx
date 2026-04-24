import Image from "next/image";
import onedriveLogo from "@/public/onedrive_logo.svg";
import googledriveLogo from "@/public/googledrive_logo.svg";
import LinkSearch from "@/components/LinkSearch";

const DriveLinkOptions = () => {
  return (
    <div className="pt-20 flex items-center gap-25">
      <div className="bg-white rounded-xl p-10 flex flex-col gap-15 shadow-[0_4px_25px_2px_rgba(0,0,0,0.08)] w-[576.18px] h-[231.64px]">
        <Image src={onedriveLogo} alt="" className="w-75 mx-auto" />
        {/* <LinkSearch type="onedrive" /> */}
        <div className="text-center text-neutral-500">
          <span>
            Coming soon<sup className="text-[10px] font-semibold">TM</sup>
          </span>
        </div>
      </div>
      <div className="bg-white rounded-xl p-10 flex flex-col gap-15 shadow-[0_4px_25px_2px_rgba(0,0,0,0.08)]">
        <Image src={googledriveLogo} alt="" className="w-75 mx-auto" />
        <LinkSearch type="gdrive" />
      </div>
    </div>
  );
};

export default DriveLinkOptions;
