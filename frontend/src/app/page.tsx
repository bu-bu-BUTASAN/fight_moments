import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      {/* ヒーローセクション */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            UFC Fight Moments
            <span className="block text-red-500 mt-2">NFT Collection</span>
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto">
            歴史に残るUFCの名シーンをNFTとして所有しよう。
            <br />
            ブロックチェーン上で証明された唯一無二のコレクション。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/mint"
              className="px-8 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-lg"
            >
              Mintを始める
            </Link>
            <Link
              href="/marketplace"
              className="px-8 py-3 bg-gray-900 text-red-400 border-2 border-red-500 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              Marketplaceを見る
            </Link>
          </div>
        </div>
      </section>

      {/* 機能紹介 */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">
            Fight Moments NFTの特徴
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <title>Unique NFTs</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                限定コレクション
              </h3>
              <p className="text-gray-400">
                各Momentはシリアルナンバー付きの限定発行。あなただけの一枚を手に入れよう。
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <title>Blockchain</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                安全な所有権
              </h3>
              <p className="text-gray-400">
                Suiブロックチェーン上で管理され、所有権が確実に証明されます。
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <title>Trading</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                自由な売買
              </h3>
              <p className="text-gray-400">
                Marketplaceで自由にNFTを売買。レアなMomentを集めよう。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA セクション */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-12 text-center text-white shadow-xl">
          <h2 className="text-3xl font-bold mb-4">今すぐ始めよう</h2>
          <p className="text-lg mb-8 text-red-100">
            ウォレットを接続して、あなたのFight
            Momentsコレクションを始めましょう
          </p>
          <Link
            href="/mint"
            className="inline-block px-8 py-3 bg-gray-900 text-red-400 rounded-lg font-semibold hover:bg-gray-800 transition-colors shadow-lg"
          >
            コレクションを見る
          </Link>
        </div>
      </section>

      {/* フッター */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto text-center">
          <p>&copy; 2024 Fight Moments NFT. All rights reserved.</p>
          <p className="mt-2 text-sm">Powered by Sui Blockchain</p>
        </div>
      </footer>
    </div>
  );
}
