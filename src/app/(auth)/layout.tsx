export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="min-h-screen bg-[#f5f4f0]">{children}</main>;
}
