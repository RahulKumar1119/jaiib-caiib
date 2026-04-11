import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/Home.css'

export default function Home() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const PAPERS = [
    {
      id: 'JAIIB_IE_IFS',
      name: 'Indian Economy & IFS',
      description: 'Master the fundamentals of Indian economy and financial system',
      icon: '📊',
    },
    {
      id: 'JAIIB_PPB',
      name: 'Principles & Practices of Banking',
      description: 'Learn core banking principles and best practices',
      icon: '🏦',
    },
    {
      id: 'JAIIB_AFB',
      name: 'Accounting & Finance for Bankers',
      description: 'Understand financial management and accounting concepts',
      icon: '💰',
    },
    {
      id: 'JAIIB_RBWM',
      name: 'Retail Banking & Wealth Management',
      description: 'Explore retail banking and wealth management strategies',
      icon: '💎',
    },
  ]

  const FEATURES = [
    {
      icon: '🎯',
      title: 'Targeted Practice',
      description: 'Practice with 4-question sets tailored to each JAIIB paper',
    },
    {
      icon: '⏱️',
      title: 'Timed Sessions',
      description: '10-minute practice sessions to simulate real exam conditions',
    },
    {
      icon: '💡',
      title: 'AI-Powered Explanations',
      description: 'Get detailed explanations with RBI and IIBF norm citations',
    },
    {
      icon: '📈',
      title: 'Performance Analytics',
      description: 'Track your progress with detailed performance metrics',
    },
    {
      icon: '✓',
      title: 'Instant Scoring',
      description: 'Get immediate feedback on your answers with detailed breakdown',
    },
    {
      icon: '🔄',
      title: 'Unlimited Practice',
      description: 'Practice unlimited sets with randomized questions',
    },
  ]

  const STATS = [
    { number: '10,000+', label: 'Students Trained' },
    { number: '95%', label: 'Success Rate' },
    { number: '500+', label: 'Live Sessions' },
    { number: '1000+', label: 'Practice Questions' },
  ]

  const TESTIMONIALS = [
    {
      name: 'Priya Sharma',
      role: 'Bank Manager, SBI',
      text: 'I cleared JAIIB in my first attempt with 87% marks. The practice sets and AI explanations were incredibly helpful!',
      rating: 5,
    },
    {
      name: 'Rajesh Kumar',
      role: 'Assistant Manager, ICICI Bank',
      text: 'The platform explained complex concepts in such a simple way. Highly recommended for anyone preparing for JAIIB.',
      rating: 5,
    },
    {
      name: 'Anjali Patel',
      role: 'Senior Executive, HDFC Bank',
      text: 'Best investment for my career. Cleared both JAIIB and CAIIB with excellent scores. Thank you!',
      rating: 5,
    },
  ]

  return (
    <div className="home-page">
      {/* Navigation */}
      <nav className="navbar">
        <div className="navbar-content">
          <div className="logo">
            <h2>JAIIB-CAIIB</h2>
            <span>Exam Prep</span>
          </div>
          <div className="nav-links">
            <a href="#papers">Papers</a>
            <a href="#features">Features</a>
            <a href="#testimonials">Success Stories</a>
            <a href="#faq">FAQ</a>
            {isAuthenticated ? (
              <>
                <button className="btn-nav" onClick={() => navigate('/dashboard')}>
                  Dashboard
                </button>
                <button className="btn-nav primary" onClick={() => navigate('/practice')}>
                  Start Practice
                </button>
              </>
            ) : (
              <>
                <button className="btn-nav" onClick={() => navigate('/login')}>
                  Login
                </button>
                <button className="btn-nav primary" onClick={() => navigate('/register')}>
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Crack JAIIB & CAIIB 2026</h1>
          <p>With India's Most Comprehensive Online Coaching Platform</p>
          <div className="hero-stats">
            {STATS.map((stat, index) => (
              <div key={index} className="stat">
                <h3>{stat.number}</h3>
                <p>{stat.label}</p>
              </div>
            ))}
          </div>
          <div className="hero-actions">
            {isAuthenticated ? (
              <>
                <button className="btn-primary" onClick={() => navigate('/practice')}>
                  Start Practicing Now
                </button>
                <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
                  View Dashboard
                </button>
              </>
            ) : (
              <>
                <button className="btn-primary" onClick={() => navigate('/register')}>
                  Start Free Trial
                </button>
                <button className="btn-secondary" onClick={() => navigate('/login')}>
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
        <div className="hero-image">
          <div className="hero-graphic">📚</div>
        </div>
      </section>

      {/* Papers Section */}
      <section id="papers" className="papers-section">
        <div className="section-header">
          <h2>JAIIB Papers</h2>
          <p>Master all four JAIIB papers with targeted practice</p>
        </div>
        <div className="papers-grid">
          {PAPERS.map((paper) => (
            <div key={paper.id} className="paper-card">
              <div className="paper-icon">{paper.icon}</div>
              <h3>{paper.name}</h3>
              <p>{paper.description}</p>
              <button
                className="btn-paper"
                onClick={() => {
                  if (isAuthenticated) {
                    navigate('/practice')
                  } else {
                    navigate('/register')
                  }
                }}
              >
                Practice Now →
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-header">
          <h2>Why Choose Our Platform?</h2>
          <p>Everything you need to ace your JAIIB exam</p>
        </div>
        <div className="features-grid">
          {FEATURES.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="section-header">
          <h2>How It Works</h2>
          <p>Simple steps to start your exam preparation</p>
        </div>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Create Account</h3>
            <p>Sign up with your email and create your profile</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Select Paper</h3>
            <p>Choose a JAIIB paper to start practicing</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Practice & Learn</h3>
            <p>Solve 4-question sets and get instant feedback</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Track Progress</h3>
            <p>Monitor your performance and improve weak areas</p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="testimonials-section">
        <div className="section-header">
          <h2>Success Stories</h2>
          <p>Join thousands of successful JAIIB candidates</p>
        </div>
        <div className="testimonials-grid">
          {TESTIMONIALS.map((testimonial, index) => (
            <div key={index} className="testimonial-card">
              <div className="stars">
                {'⭐'.repeat(testimonial.rating)}
              </div>
              <p className="testimonial-text">"{testimonial.text}"</p>
              <div className="testimonial-author">
                <strong>{testimonial.name}</strong>
                <span>{testimonial.role}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="faq-section">
        <div className="section-header">
          <h2>Frequently Asked Questions</h2>
          <p>Get answers to common questions</p>
        </div>
        <div className="faq-items">
          <div className="faq-item">
            <h3>What is JAIIB?</h3>
            <p>
              JAIIB (Junior Associate of the Indian Institute of Banking and Finance) is a
              certification exam for banking professionals. It consists of 4 papers covering
              different aspects of banking and finance.
            </p>
          </div>
          <div className="faq-item">
            <h3>How many questions are in each practice set?</h3>
            <p>
              Each practice set contains 4 multiple-choice questions from a specific JAIIB paper.
              You have 10 minutes to complete each set, simulating real exam conditions.
            </p>
          </div>
          <div className="faq-item">
            <h3>Can I access explanations for all questions?</h3>
            <p>
              Yes! After completing a practice set, you can view detailed AI-generated explanations
              for each question, including relevant RBI and IIBF norms and guidelines.
            </p>
          </div>
          <div className="faq-item">
            <h3>How is my performance tracked?</h3>
            <p>
              Your dashboard displays comprehensive analytics including average scores, paper-wise
              performance, score trends, and recent results. This helps you identify areas for
              improvement.
            </p>
          </div>
          <div className="faq-item">
            <h3>Can I practice unlimited sets?</h3>
            <p>
              Yes! You can practice unlimited practice sets with randomized questions. Each set is
              unique, ensuring you get diverse questions for comprehensive preparation.
            </p>
          </div>
          <div className="faq-item">
            <h3>Is there a time limit for practice sessions?</h3>
            <p>
              Each practice set has a 10-minute timer to simulate real exam conditions. However,
              you can pause and resume sessions within 15 minutes.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2>Ready to Crack JAIIB & CAIIB?</h2>
        <p>Join thousands of successful students. Start your free trial today!</p>
        {!isAuthenticated && (
          <button className="btn-cta" onClick={() => navigate('/register')}>
            Start Free Trial Now
          </button>
        )}
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>About Us</h4>
            <p>
              Leading online platform for JAIIB & CAIIB exam preparation with expert faculty and
              proven results.
            </p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li>
                <a href="#papers">Papers</a>
              </li>
              <li>
                <a href="#features">Features</a>
              </li>
              <li>
                <a href="#testimonials">Success Stories</a>
              </li>
              <li>
                <a href="#faq">FAQ</a>
              </li>
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
