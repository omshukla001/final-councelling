import * as Accordion from "@radix-ui/react-accordion";
import { MessageCircle, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Component to render section-specific FAQs
const SectionFAQs = ({ sectionFaqs, sectionKeys }: { sectionFaqs: Record<string, any[]> | undefined, sectionKeys: string[] }) => {
  if (!sectionFaqs) return null;
  const faqs = sectionKeys.flatMap(key => sectionFaqs[key] || []);
  if (faqs.length === 0) return null;

  return (
    <div className="mt-8 bg-[#11111a] border border-white/5 rounded-3xl p-6 hover:border-purple-500/20 transition-colors duration-500">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
          <MessageCircle className="w-4 h-4 text-purple-400" />
        </div>
        <h3 className="text-lg font-bold text-stone-900/90">Related FAQs</h3>
        <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-xs">{faqs.length}</Badge>
      </div>
      <Accordion.Root type="single" collapsible className="w-full space-y-3">
        {faqs.map((faq: { question: string; answer: string }, i: number) => (
          <Accordion.Item key={i} value={`sfaq-${i}`} className="bg-[#0a0a0f] border border-white/5 rounded-xl overflow-hidden hover:border-purple-500/20 transition-all">
            <Accordion.Header>
              <Accordion.Trigger className="w-full flex items-center justify-between p-4 text-left text-white/80 text-sm font-medium hover:text-stone-900 group transition-colors">
                <span>{faq.question}</span>
                <ChevronDown className="w-4 h-4 text-stone-900/30 group-data-[state=open]:text-purple-400 group-data-[state=open]:rotate-180 transition-all duration-300 shrink-0 ml-2" aria-hidden />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="text-stone-900/50 px-4 pb-4 text-sm leading-relaxed overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
              <div className="pt-2 border-t border-white/5">{faq.answer}</div>
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </div>
  );
};

export default SectionFAQs;
