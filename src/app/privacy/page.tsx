import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-2">Data Processing</h2>
          <p>
            This website is a non-commercial open-source project and does not collect any personal data.
            All displayed information consists of publicly available data from the Bluesky network.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Hosting</h2>
          <p>This website is hosted on Vercel. For technical reasons, Vercel automatically collects:</p>
          <ul className="list-disc ml-6 mt-2">
            <li>Server logs with IP addresses (automatically deleted after a short period)</li>
            <li>Basic technical access data required for website operation</li>
          </ul>
          <p className="mt-2">
            For details about Vercel&apos;s data processing, please refer to their
            <a
              href="https://vercel.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline ml-1"
            >
              Privacy Policy
            </a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Project Details</h2>
          <p>
            This project&apos;s source code is publicly available on
            <a
              href="https://github.com/CrispStrobe/starter-pack-explorer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline ml-1"
            >
              GitHub
            </a>.
          </p>
        </section>
      </div>

      <div className="mt-8">
        <Link href="/" className="text-blue-600 hover:underline">← Back to Home</Link>
      </div>
    </div>
  );
}
