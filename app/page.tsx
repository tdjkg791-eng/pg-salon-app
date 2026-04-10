import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-white">
      <div className="max-w-sm w-full text-center">
        <h1 className="text-3xl font-bold text-pg-green mb-2">Pg. サロン</h1>
        <p className="text-gray-600 mb-10">
          Pg. 式ダイエット 顧客管理・食事記録
        </p>

        <div className="space-y-4">
          <Link
            href="/home"
            className="block w-full py-4 rounded-xl bg-pg-green text-white font-semibold shadow hover:opacity-90 transition"
          >
            お客様ログイン (LINE)
          </Link>
          <Link
            href="/dashboard"
            className="block w-full py-4 rounded-xl border-2 border-pg-green text-pg-green font-semibold hover:bg-pg-green hover:text-white transition"
          >
            スタッフログイン
          </Link>
        </div>

        <p className="mt-10 text-xs text-gray-400">
          &copy; Pg. Salon
        </p>
      </div>
    </main>
  );
}
