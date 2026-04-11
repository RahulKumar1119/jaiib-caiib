import { useNavigate } from 'react-router-dom'
import '../styles/Home.css'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="home-container">
      {/* Navigation */}
      <nav className="navbar">
        <div className="navbar-content">
          <div className="logo">
            <h2>JAIIB-CAIIB</h2>
            <span>Exam Prep</span>
          </div>
          <div className="nav-links">
            <a href="#courses">Courses</a>
            <a href="#features">Features</a>
            <a href="#success">Success Stories</a>
            <a href="#faq">FAQ</a>
            <button className="btn-login" onClick={() => navigate('/login')}>
              Login
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Crack JAIIB & CAIIB 2026</h1>
          <p>With India's Most Comprehensive Online Coaching Platform</p>
          <div className="hero-stats">
            <div className="stat">
              <h3>10,000+</h3>
              <p>Students Trained</p>
            </div>
            <div className="stat">
              <h3>95%</h3>
              <p>Success Rate</p>
            </div>
            <div className="stat">
              <h3>500+</h3>
              <p>Live Sessions</p>
            </div>
          </div>
          <button className="btn-primary" onClick={() => navigate('/register')}>
            Start Free Trial
          </button>
        </div>
        <div className="hero-image">
          <div className="hero-graphic">📚</div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="why-choose">
        <h2>Why Choose Our Platform?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🎓</div>
            <h3>Expert Faculty</h3>
            <p>Learn from experienced banking professionals with 15+ years of expertise</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>Learn Anywhere</h3>
            <p>Access courses on mobile, tablet, or desktop at your own pace</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Mock Tests</h3>
            <p>500+ practice questions with detailed analysis and performance tracking</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>Doubt Sessions</h3>
            <p>Weekly live doubt-clearing sessions with instructors</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📚</div>
            <h3>Study Material</h3>
            <p>Comprehensive notes and study guides for all 4 papers</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🏆</div>
            <h3>Guaranteed Results</h3>
            <p>Money-back guarantee if you don't pass on your first attempt</p>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section id="courses" className="courses">
        <h2>Our Courses</h2>
        <div className="courses-grid">
          <div className="course-card">
            <div className="course-badge">Most Popular</div>
            <h3>Foundation Batch</h3>
            <p className="course-desc">Perfect for beginners starting from scratch</p>
            <ul className="course-features">
              <li>✓ 200+ Live Sessions</li>
              <li>✓ All 4 Papers Covered</li>
              <li>✓ 500+ Practice Questions</li>
              <li>✓ Weekly Doubt Sessions</li>
              <li>✓ Study Materials</li>
            </ul>
            <div className="course-price">
              <span className="price">₹4,999</span>
              <span className="original">₹9,999</span>
            </div>
            <button className="btn-enroll" onClick={() => navigate('/register')}>
              Enroll Now
            </button>
          </div>

          <div className="course-card featured">
            <div className="course-badge">Best Value</div>
            <h3>Rapid Revision Batch</h3>
            <p className="course-desc">Last-minute crash course for quick prep</p>
            <ul className="course-features">
              <li>✓ 50+ Revision Sessions</li>
              <li>✓ Quick Concept Review</li>
              <li>✓ 200+ Practice Questions</li>
              <li>✓ Daily Doubt Sessions</li>
              <li>✓ Revision Notes</li>
            </ul>
            <div className="course-price">
              <span className="price">₹2,999</span>
              <span className="original">₹5,999</span>
            </div>
            <button className="btn-enroll" onClick={() => navigate('/register')}>
              Enroll Now
            </button>
          </div>

          <div className="course-card">
            <div className="course-badge">Complete Package</div>
            <h3>Mega Cracker Bundle</h3>
            <p className="course-desc">JAIIB + CAIIB complete preparation</p>
            <ul className="course-features">
              <li>✓ 400+ Live Sessions</li>
              <li>✓ Both JAIIB & CAIIB</li>
              <li>✓ 1000+ Practice Questions</li>
              <li>✓ Unlimited Doubt Sessions</li>
              <li>✓ Lifetime Access</li>
            </ul>
            <div className="course-price">
              <span className="price">₹7,999</span>
              <span className="original">₹15,999</span>
            </div>
            <button className="btn-enroll" onClick={() => navigate('/register')}>
              Enroll Now
            </button>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section id="success" className="success-stories">
        <h2>Success Stories</h2>
        <div className="testimonials">
          <div className="testimonial">
            <div className="stars">⭐⭐⭐⭐⭐</div>
            <p>
              "I cleared JAIIB in my first attempt with 87% marks. The live sessions and mock tests were incredibly helpful!"
            </p>
            <div className="testimonial-author">
              <strong>Priya Sharma</strong>
              <span>Bank Manager, SBI</span>
            </div>
          </div>

          <div className="testimonial">
            <div className="stars">⭐⭐⭐⭐⭐</div>
            <p>
              "The faculty explained complex concepts in such a simple way. Highly recommended for anyone preparing for JAIIB."
            </p>
            <div className="testimonial-author">
              <strong>Rajesh Kumar</strong>
              <span>Assistant Manager, ICICI Bank</span>
            </div>
          </div>

          <div className="testimonial">
            <div className="stars">⭐⭐⭐⭐⭐</div>
            <p>
              "Best investment for my career. Cleared both JAIIB and CAIIB with excellent scores. Thank you!"
            </p>
            <div className="testimonial-author">
              <strong>Anjali Patel</strong>
              <span>Senior Executive, HDFC Bank</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Choose Your Course</h3>
            <p>Select the course that fits your preparation timeline and needs</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Enroll & Get Access</h3>
            <p>Complete registration and get instant access to all course materials</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Learn & Practice</h3>
            <p>Attend live sessions, solve practice questions, and clear doubts</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Ace Your Exam</h3>
            <p>Take mock tests, get feedback, and pass your JAIIB/CAIIB exam</p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="faq">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-items">
          <div className="faq-item">
            <h3>What is the duration of the course?</h3>
            <p>
              Foundation Batch: 3-4 months | Rapid Revision: 1 month | Mega Cracker: 6 months with lifetime access
            </p>
          </div>
          <div className="faq-item">
            <h3>Can I access the course on mobile?</h3>
            <p>Yes, all courses are fully accessible on mobile, tablet, and desktop devices.</p>
          </div>
          <div className="faq-item">
            <h3>Is there a money-back guarantee?</h3>
            <p>Yes, if you don't pass the exam after completing our course, we offer a full refund.</p>
          </div>
          <div className="faq-item">
            <h3>Do you provide study materials?</h3>
            <p>Yes, comprehensive study notes, PDFs, and revision materials are included with every course.</p>
          </div>
          <div className="faq-item">
            <h3>Can I interact with instructors?</h3>
            <p>Absolutely! We have weekly doubt-clearing sessions and a dedicated support team.</p>
          </div>
          <div className="faq-item">
            <h3>What if I miss a live session?</h3>
            <p>All sessions are recorded and available for lifetime access, so you can watch them anytime.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <h2>Ready to Crack JAIIB & CAIIB?</h2>
        <p>Join thousands of successful students. Start your free trial today!</p>
        <button className="btn-primary-large" onClick={() => navigate('/register')}>
          Start Free Trial Now
        </button>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>About Us</h4>
            <p>Leading online platform for JAIIB & CAIIB exam preparation with expert faculty and proven results.</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="#courses">Courses</a></li>
              <li><a href="#features">Features</a></li>
              <li><a href="#success">Success Stories</a></li>
              <li><a href="#faq">FAQ</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Contact</h4>
            <p>Email: support@jaiibcaiib.com</p>
            <p>Phone: +91-XXXX-XXXX-XX</p>
          </div>
          <div className="footer-section">
            <h4>Follow Us</h4>
            <div className="social-links">
              <a href="#">Facebook</a>
              <a href="#">Twitter</a>
              <a href="#">LinkedIn</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 JAIIB-CAIIB Exam Prep. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
