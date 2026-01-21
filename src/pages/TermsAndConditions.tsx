import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BantayAniLogo } from '@/components/BantayAniLogo';

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </Link>
          <div className="flex-1 flex justify-center">
            <BantayAniLogo size="sm" />
          </div>
          <div className="w-16" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-foreground mb-2">Terms and Conditions</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 21, 2026</p>

        <div className="prose prose-invert max-w-none space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Welcome to BantayAni, a pest detection and agricultural monitoring application developed 
              to assist farmers and Local Government Units (LGUs) in the Philippines. By accessing or 
              using our application, you agree to be bound by these Terms and Conditions. Please read 
              them carefully before using our services.
            </p>
          </section>

          {/* Definitions */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Definitions</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li><strong className="text-foreground">"Application"</strong> refers to the BantayAni mobile and web platform.</li>
              <li><strong className="text-foreground">"User"</strong> refers to any individual who accesses or uses the Application.</li>
              <li><strong className="text-foreground">"Farmer"</strong> refers to registered users who use the Application for pest detection.</li>
              <li><strong className="text-foreground">"LGU Admin"</strong> refers to authorized local government personnel managing the platform.</li>
              <li><strong className="text-foreground">"Content"</strong> refers to all data, images, reports, and information submitted through the Application.</li>
            </ul>
          </section>

          {/* User Accounts */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. User Accounts</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              To use certain features of the Application, you must create an account. You agree to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Provide accurate, current, and complete information during registration.</li>
              <li>Maintain the security of your password and account credentials.</li>
              <li>Notify us immediately of any unauthorized use of your account.</li>
              <li>Accept responsibility for all activities that occur under your account.</li>
            </ul>
          </section>

          {/* Location Services */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Location Services and Data Collection</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              BantayAni requires access to your device's location services to function properly. By using the Application, you consent to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Collection of GPS coordinates when submitting pest detection reports.</li>
              <li>Use of location data to map pest outbreaks and generate agricultural advisories.</li>
              <li>Sharing of anonymized location data with LGU administrators for monitoring purposes.</li>
              <li>Storage of location history for historical analysis and trend identification.</li>
            </ul>
          </section>

          {/* Image and Content */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Image Capture and Content Submission</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              When submitting pest detection reports, you grant BantayAni:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>A non-exclusive, royalty-free license to use, store, and process submitted images.</li>
              <li>Permission to use images for AI model training and improvement.</li>
              <li>The right to share images with agricultural experts and LGU personnel for verification.</li>
              <li>Authorization to include anonymized data in research and public health reports.</li>
            </ul>
          </section>

          {/* AI Detection */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. AI-Powered Detection Disclaimer</h2>
            <p className="text-muted-foreground leading-relaxed">
              The pest detection feature uses artificial intelligence to identify potential agricultural pests. 
              While we strive for accuracy, you acknowledge that:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-3">
              <li>AI detections are preliminary and subject to verification by LGU administrators.</li>
              <li>Detection accuracy may vary based on image quality, lighting, and pest visibility.</li>
              <li>The Application should not replace professional agricultural consultation.</li>
              <li>BantayAni is not liable for crop losses resulting from detection inaccuracies.</li>
            </ul>
          </section>

          {/* User Responsibilities */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">7. User Responsibilities</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              As a user of BantayAni, you agree to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Submit only authentic images of actual pest infestations on your farm.</li>
              <li>Provide accurate location information for pest reports.</li>
              <li>Not submit false, misleading, or fraudulent reports.</li>
              <li>Respect the verification decisions made by LGU administrators.</li>
              <li>Use advisories and recommendations responsibly.</li>
            </ul>
          </section>

          {/* Privacy */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">8. Privacy and Data Protection</h2>
            <p className="text-muted-foreground leading-relaxed">
              We are committed to protecting your privacy. Personal information collected through the Application 
              is handled in accordance with the Data Privacy Act of 2012 (Republic Act No. 10173). We implement 
              appropriate security measures to protect your data from unauthorized access, alteration, or disclosure.
            </p>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">9. Account Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to suspend or terminate your account if you violate these Terms and Conditions, 
              submit fraudulent reports, or engage in any activity that compromises the integrity of the platform 
              or the safety of other users.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">10. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              BantayAni and its developers shall not be liable for any indirect, incidental, special, consequential, 
              or punitive damages arising from your use of the Application. This includes but is not limited to 
              crop losses, economic damages, or decisions made based on AI detections or advisories.
            </p>
          </section>

          {/* Changes */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">11. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update these Terms and Conditions from time to time. Users will be notified of significant 
              changes through the Application or via email. Continued use of the Application after changes 
              constitutes acceptance of the updated terms.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">12. Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions or concerns regarding these Terms and Conditions, please contact us at:
            </p>
            <div className="mt-3 p-4 bg-card rounded-lg border border-border">
              <p className="text-foreground font-medium">BantayAni Support Team</p>
              <p className="text-muted-foreground">Email: bantayaniph@gmail.com</p>
              <p className="text-muted-foreground">Address: Department of Agriculture, Philippines</p>
            </div>
          </section>

          {/* Agreement */}
          <section className="pt-4 border-t border-border">
            <p className="text-muted-foreground leading-relaxed">
              By checking the "I agree to the Terms and Conditions" box during registration, you acknowledge 
              that you have read, understood, and agree to be bound by these Terms and Conditions.
            </p>
          </section>
        </div>

        {/* Back to Login Button */}
        <div className="mt-12 text-center">
          <Link 
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </div>
      </main>
    </div>
  );
};

export default TermsAndConditions;
