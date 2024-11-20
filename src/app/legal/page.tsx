import Link from 'next/link';

export default function LegalNotice() {
  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Legal Notice</h1>

      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-2">Contact Information</h2>
          <p>This is a non-commercial, open-source project.</p>
          <p className="mt-2">
            <a
              href="https://github.com/CrispStrobe/starter-pack-explorer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              GitHub Repository
            </a>
          </p>
          <p className="mt-2">
            Contact available through GitHub Issues or Discussions.
          </p>
        </section>
      </div>

      <div className="mt-8">
        <Link href="/" className="text-blue-600 hover:underline">← Back to Home</Link>
      </div>
    </div>
  );
}
