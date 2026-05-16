import FeatureTabs from "../components/FeatureTabs";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-1 flex-col bg-slate-50">
      <FeatureTabs />
      {children}
    </div>
  );
}
