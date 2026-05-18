import { useNavigate } from 'react-router-dom'

export default function PrivacyPolicy() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-accent">RestroWatch</h1>
            </div>
            <span className="text-gray-400 text-sm">Privacy Policy</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-card border border-border rounded-xl p-8 text-gray-300 space-y-6">
          <h2 className="text-2xl font-bold text-white">Privacy Policy</h2>
          <p className="text-sm text-gray-400">Last Updated: May 2024</p>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-accent">1. Introduction</h3>
            <p>
              RestroWatch ("we," "us," "our," or "Company") operates the RestroWatch service. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our service and the choices you have associated with that data.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-accent">2. Data Collection and Use</h3>
            <p>We collect several different types of information for various purposes to provide and improve our service to you:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Personal Data:</strong> While using our service, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you ("Personal Data"). This may include, but is not limited to:
                <ul className="list-circle pl-6 mt-2 space-y-1">
                  <li>Email address</li>
                  <li>Name</li>
                  <li>Restaurant information</li>
                  <li>Usage data</li>
                </ul>
              </li>
              <li><strong>Usage Data:</strong> We may also collect information about how the service is accessed and used ("Usage Data"). This may include information such as your computer's Internet Protocol address, browser type, browser version, pages you visit, time and date of your visit, and other diagnostic data.</li>
              <li><strong>Cookies:</strong> We use cookies and similar tracking technologies to track activity on our service and hold certain information.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-accent">3. Use of Data</h3>
            <p>RestroWatch uses the collected data for various purposes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide and maintain our service</li>
              <li>To notify you about changes to our service</li>
              <li>To allow you to participate in interactive features of our service</li>
              <li>To provide customer support</li>
              <li>To gather analysis or valuable information so that we can improve our service</li>
              <li>To monitor the usage of our service</li>
              <li>To detect, prevent and address technical issues</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-accent">4. Security of Data</h3>
            <p>
              The security of your data is important to us, but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-accent">5. Changes to This Privacy Policy</h3>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date at the top of this Privacy Policy.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-accent">6. Contact Us</h3>
            <p>
              If you have any questions about this Privacy Policy, please contact us by email at support@restrowatch.app
            </p>
          </section>

          <div className="border-t border-border pt-6 mt-8">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
