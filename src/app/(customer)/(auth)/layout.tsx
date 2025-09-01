export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-red-300 to-cyan-900">
      {children}
    </div>
  );
}
