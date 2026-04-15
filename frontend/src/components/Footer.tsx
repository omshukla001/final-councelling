import { Twitter, Github, Linkedin, Mail, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="relative border-t border-stone-200 bg-stone-50">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border-2 border-amber-400/30">
                <img src="/logo.png" alt="CounsellorWala" className="w-full h-full object-cover" />
              </div>
              <span className="font-extrabold text-lg">
                <span className="text-stone-800">Counsellor</span><span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-orange-500">Wala</span>
              </span>
            </Link>
            <p className="text-sm text-stone-500 leading-relaxed">
              Helping students find the perfect college after JEE with AI-powered, data-driven recommendations.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-stone-900 mb-4 text-sm">Quick Links</h4>
            <ul className="space-y-2.5 text-sm text-stone-500">
              <li><Link to="/predictor" className="hover:text-violet-400 transition-colors">College Predictor</Link></li>
              <li><Link to="/colleges" className="hover:text-violet-400 transition-colors">Browse Colleges</Link></li>
              <li><Link to="/compare" className="hover:text-violet-400 transition-colors">Compare Colleges</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-stone-900 mb-4 text-sm">Resources</h4>
            <ul className="space-y-2.5 text-sm text-stone-500">
              <li><Link to="/colleges" className="hover:text-violet-400 transition-colors">JEE Cutoff Trends</Link></li>
              <li><Link to="/counsellor-sheet" className="hover:text-violet-400 transition-colors">Counsellor Sheet</Link></li>
              <li><Link to="/ai-counsellor" className="hover:text-violet-400 transition-colors">AI Counsellor</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-stone-900 mb-4 text-sm">Connect</h4>
            <div className="flex gap-2">
              {[
                { Icon: Twitter, href: "#" },
                { Icon: Github, href: "https://github.com/pranav-dev-01" },
                { Icon: Linkedin, href: "#" },
                { Icon: Mail, href: "#" },
              ].map(({ Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-500 hover:text-violet-400 hover:border-violet-500/30 hover:bg-violet-500/10 transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-stone-200 text-center text-sm text-stone-400">
          &copy; {new Date().getFullYear()} CounsellorWala. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
