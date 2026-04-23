import TopNav from "@/components/TopNav";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-screen flex flex-col">
      <div>
        <TopNav />
      </div>
      <div className="h-full">{children}</div>
    </div>
  );
};

export default DashboardLayout;
