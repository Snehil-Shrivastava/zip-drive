import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-screen flex flex-col pb-10">
      <div>
        <TopNav isLoggedIn={false} />
      </div>
      <div className="flex flex-1 pr-20">
        <div className="w-80 p-10">
          <Sidebar isLoggedIn={false} />
        </div>
        <div className="bg-[#333333] flex-1 rounded-2xl p-10 h-[90vh]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
