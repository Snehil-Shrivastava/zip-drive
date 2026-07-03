import Image from "next/image";
import googledriveLogo from "@/public/googledrive_logo.svg";
import LinkSearch from "@/components/LinkSearch";

const DriveLinkOptions = () => {
  return (
    <div className="pt-20 flex items-center gap-25 max-sm:w-full">
      <div className="bg-white rounded-xl p-10 max-sm:px-5 flex flex-col gap-15 max-sm:gap-8 shadow-[0_4px_25px_2px_rgba(0,0,0,0.08)] max-sm:w-full">
        <Image
          src={googledriveLogo}
          alt=""
          className="w-75 max-sm:w-50 mx-auto"
        />
        <LinkSearch />
      </div>
    </div>
  );
};

export default DriveLinkOptions;
