import { useNavigate } from 'react-router-dom'

export default function TermsOfService() {
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
            <span className="text-gray-400 text-sm">Terms of Service</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-card border border-border rounded-xl p-8 text-gray-300 space-y-6">
          <h2 className="text-2xl font-bold text-white">Terms of Service</h2>
          <p className="text-sm text-gray-400">Last Updated: May 2024</p>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-accent">1. Acceptance of Terms</h3>
            <p>
              By accessing and using RestroWatch, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-accent">2. Use License</h3>
            <p>
              Permission is granted to temporarily download one copy of the materials (information or software) on RestroWatch for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Modifying or copying the materials</li>
              <li>Using the materials for any commercial purpose or for any public display</li>
              <li>Attempting to decompile or reverse engineer any software contained on RestroWatch</li>
              <li>Removing any copyright or other proprietary notations from the materials</li>
              <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-accent">3. Disclaimer</h3>
            <p>
              The materials on RestroWatch are provided on an 'as is' basis. RestroWatch makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-accent">4. Limitations</h3>
            <p>
              In no event shall RestroWatch or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on RestroWatch, even if RestroWatch or an authorized representative has been notified orally or in writing of the possibility of such damage.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-accent">5. Accuracy of Materials</h3>
            <p>
              The materials appearing on RestroWatch could include technical, typographical, or photographic errors. RestroWatch does not warrant that any of the materials on its website are accurate, complete, or current. RestroWatch may make changes to the materials contained on its website at any time without notice.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-accent">6. Materials on Other Websites</h3>
            <p>
              RestroWatch has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by RestroWatch of the site. Use of any such linked website is at the user's own risk.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-accent">7. Modifications</h3>
            <p>
              RestroWatch may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-accent">8. Governing Law</h3>
            <p>
              These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction where RestroWatch operates, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-accent">9. User Responsibilities</h3>
            <p>As a user of RestroWatch, you agree to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the service only for authorized and lawful purposes</li>
              <li>Maintain the confidentiality of your account and password</li>
              <li>Accept responsibility for all activities that occur under your account</li>
              <li>Not provide false or misleading information</li>
              <li>Not engage in any conduct that restricts or inhibits anyone's use or enjoyment of the service</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-accent">10. Contact Information</h3>
            <p>
              If you have any questions about these Terms of Service, please contact us at support@restrowatch.app
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
