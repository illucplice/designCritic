// These are fixed sample analyses used purely so a brand-new user can see
// what a critique looks like before uploading anything. They are always
// tagged isDemo: true and the UI must never blend them into a user's real
// analysis history or claim they came from analyzing the user's design.

function cat(score, strengths, issues, recommendations) {
  return { score, strengths, issues, recommendations };
}

export const demoDesigns = [
  {
    id: "demo-1",
    isDemo: true,
    title: "Midnight Product Launch",
    designType: "Advertisement",
    mode: "Professional",
    image:
      "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1000&q=85",
    createdAt: "2026-01-14T10:00:00.000Z",
    analysis: {
      overallScore: 8.2,
      summary:
        "A confident, high-contrast product ad where a single bold headline and strong lighting create an immediate focal point.",
      categories: {
        visualHierarchy: cat(
          9,
          ["The oversized headline is the clear first read, with the product image anchoring the second."],
          ["The small print in the corner competes slightly with the logo for third-level attention."],
          ["Reduce the corner text to one line so it reads as a footnote, not a competing element."]
        ),
        typography: cat(
          8,
          ["Strong size contrast between headline and supporting copy creates a clean hierarchy."],
          ["Letter spacing on the headline feels slightly tight at this size."],
          ["Open the tracking on the headline by 1-2% for better breathing room at large sizes."]
        ),
        composition: cat(
          8,
          ["The product sits on a clean diagonal that leads the eye toward the headline."],
          ["The bottom-right corner feels comparatively empty next to the dense left side."],
          ["Add a small supporting element or shift the crop to rebalance the bottom-right quadrant."]
        ),
        color: cat(
          9,
          ["The deep navy background makes the warm highlight on the product pop immediately."],
          [],
          ["Consider a single accent color for the CTA so it doesn't rely on brightness alone."]
        ),
        spacing: cat(7, ["Generous margin around the headline lets it breathe."], ["The lower content block feels tighter than the top of the composition."], ["Add 12-16px more vertical space above the lower text block."]),
        readability: cat(8, ["White text on the dark background has strong contrast."], ["The smallest caption text may be difficult to read on mobile."], ["Increase the smallest text size by 2-3px for small-screen legibility."]),
        branding: cat(8, ["Logo placement is consistent with typical premium product ads."], [], ["Repeat the accent color from the logo somewhere else in the composition to tie the brand together."]),
        communication: cat(9, ["The message is understandable in under two seconds."], [], []),
        professionalPolish: cat(8, ["Alignment throughout is precise and intentional."], ["A couple of edges near the bottom text are slightly inconsistent."], ["Double check margin consistency on the bottom text block against the top."]),
      },
      whatWorks: [
        "Strong focal point created through scale and lighting contrast.",
        "Color palette feels intentional and supports a premium tone.",
        "Message is understandable at a glance.",
      ],
      needsImprovement: [
        "The lower information block is slightly denser than the headline area.",
        "Bottom-right composition feels comparatively empty.",
      ],
      priorityFixes: [
        {
          priority: "Medium",
          problem: "The lower text block sits tighter than the rest of the layout.",
          why: "Inconsistent spacing rhythm makes a layout feel unfinished even when individual elements are strong.",
          recommendation: "Add 12-16px of additional vertical space above the lower text block to match the top's breathing room.",
        },
      ],
      elements: { detected: ["headline", "product image", "logo", "caption text"], notes: "A clear headline, product hero shot, logo, and small caption text are visible." },
      finalVerdict:
        "A strong, premium-feeling ad with a clear focal point. Tightening the bottom spacing and letter tracking would push it from good to excellent.",
    },
  },
  {
    id: "demo-2",
    isDemo: true,
    title: "Social Campaign",
    designType: "Instagram Post",
    mode: "Professional",
    image:
      "https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=1000&q=85",
    createdAt: "2026-01-20T10:00:00.000Z",
    analysis: {
      overallScore: 8.8,
      summary: "A clean, high-impact social post with excellent focus and a confident, restrained color system.",
      categories: {
        visualHierarchy: cat(9, ["Single subject placement leaves no ambiguity about the first read."], [], []),
        typography: cat(9, ["Minimal type usage keeps the message tight and confident."], [], []),
        composition: cat(9, ["Subject is well-framed with balanced negative space around it."], [], []),
        color: cat(9, ["Restrained palette avoids competing accents."], [], []),
        spacing: cat(8, ["Consistent margin around the frame."], [], []),
        readability: cat(9, ["High contrast between subject and background."], [], []),
        branding: cat(9, ["Consistent visual tone with a recognizable style."], [], []),
        communication: cat(9, ["Communicates a single idea instantly."], [], []),
        professionalPolish: cat(9, ["Crop and alignment feel deliberate."], [], []),
      },
      whatWorks: ["Clear single focal point.", "Confident, restrained color system.", "Message reads instantly."],
      needsImprovement: ["Little room for improvement — a genuinely tight execution."],
      priorityFixes: [],
      elements: { detected: ["subject photo", "minimal text overlay"], notes: "Mostly image-led with minimal or no text overlay." },
      finalVerdict: "A tightly executed, confident post. This is close to a best-practice example of restraint working in a design's favor.",
    },
  },
];
