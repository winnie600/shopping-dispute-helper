// src/data/cases.ts
import type { CaseData } from '../types';

export const CASES: CaseData[] = [
  // =========================
  // CASE 1 — iPhone 12 (SNAD)
  // =========================
  {
    id: 'case1',
    title: 'iPhone 12 128GB — Like New (Blue)',
    listingInfo: {
      title: 'iPhone 12 128GB — Like New (Blue)',
      listedPrice: 'NT$9,500',
      condition: 'Like new',
      disclosedFlaws:
        'Very light scratch on the bottom frame (photo 4), no earphones included',
      attributes:
        'Blue color, 128GB, iOS 17.xx; Battery ~88% (confirmed in chat)',
      photos: [
        { url: '/images/case%201/iph12_front.jpg',   label: 'front' },
        { url: '/images/case%201/iph12_back.jpg',    label: 'back' },
        { url: '/images/case%201/iph12_scratch.jpg', label: 'scratch close-up' },
      ],
      notes:
        'Not mentioned: any repair/replacement history. Non-disclosure of screen replacement is material.',
    },
    orderMeta: [{ label: 'Order ID', value: 'TW-10567' }],
    complaint:
      'Undisclosed screen replacement. Apple Support shows “Display – Genuine Apple Part (Replaced)”.',
    chatLog: [
      // --- Pre-transaction inquiry & bargaining ---
      { timestamp: '2025-10-05 11:58', sender: 'Buyer', text: 'Hi, is the phone still available? Same condition as in the photos?' },
      { timestamp: '2025-10-05 12:02', sender: 'Seller', text: 'Yes, still available. Same as shown. I’ve kept it in great condition — only a tiny scratch on the lower frame (see photo 4).' },
      { timestamp: '2025-10-05 12:05', sender: 'Buyer', text: 'What’s the battery health? Any yellow tint or display issues? True Tone okay?' },
      { timestamp: '2025-10-05 12:08', sender: 'Seller', text: 'Around 88%, runs smoothly. Screen is fine, True Tone normal.' },
      { timestamp: '2025-10-05 12:10', sender: 'Buyer', text: 'Has it ever been repaired or had any parts replaced? Face ID works?' },
      { timestamp: '2025-10-05 12:12', sender: 'Seller', text: 'Face ID works. Haven’t done any major repairs.' },
      { timestamp: '2025-10-05 12:16', sender: 'Buyer', text: 'Can you lower the price a bit? I’ve seen some listed around 9.0–9.2k.' },
      { timestamp: '2025-10-05 12:19', sender: 'Seller', text: 'I listed 9.5 because it’s in excellent shape. If you confirm now, I can do 9.2.' },
      { timestamp: '2025-10-05 12:22', sender: 'Buyer', text: 'Okay, 9.2 works. Can we do 7-ELEVEN COD? I’m busy and can’t meet in person.' },
      { timestamp: '2025-10-05 12:24', sender: 'Seller', text: 'Sure. Send me your preferred 7-ELEVEN pickup store.' },
      { timestamp: '2025-10-05 12:26', sender: 'Buyer', text: '7-ELEVEN Minsheng (Songshan). How much is the shipping?' },
      { timestamp: '2025-10-05 12:27', sender: 'Seller', text: 'COD shipping fee is NT$60, paid at pickup.' },
      { timestamp: '2025-10-05 12:30', sender: 'Buyer', text: 'Okay. Does it come with a charging cable?' },
      { timestamp: '2025-10-05 12:31', sender: 'Seller', text: 'No earphones, but I’ll include a third-party cable.' },
      { timestamp: '2025-10-05 12:33', sender: 'Buyer', text: 'Could you send one photo with a white background and screen brightness ~80% so I can check the display?' },
      { timestamp: '2025-10-05 12:36', sender: 'Seller', text: '(sends photo) Took it under warm indoor light — looks fine.' },
      { timestamp: '2025-10-05 12:39', sender: 'Buyer', text: 'Looks good. Please create the order on the app.' },
      { timestamp: '2025-10-05 12:41', sender: 'Seller', text: 'Will do.' },

      // --- Order creation / shipping / arrival / pickup ---
      { timestamp: '2025-10-05 13:22', sender: 'System', text: 'Order created (Order ID: TW-10567).' },
      { timestamp: '2025-10-06 10:15', sender: 'Seller', text: 'I’ve shipped it via 7-ELEVEN (ibon). You should get it tomorrow.' },
      { timestamp: '2025-10-07 09:00', sender: 'System', text: 'Package arrived at 7-ELEVEN Minsheng.' },
      { timestamp: '2025-10-07 18:40', sender: 'Buyer', text: 'Just picked it up and paid (item + NT$60 COD). Thanks!' },

      // --- Issue raised before completion ---
      { timestamp: '2025-10-07 20:05', sender: 'Buyer', text: 'I checked and found the screen has been replaced. Apple Support shows “Genuine Apple Part – Display replaced” (see attached screenshot). The listing and chat never mentioned this. I’d like to return the item for a refund.', highlight: true },
      { timestamp: '2025-10-07 20:12', sender: 'Seller', text: 'The screen is genuine Apple, I have the service record. You didn’t ask, so I didn’t bring it up. Works perfectly fine.' },
      { timestamp: '2025-10-07 20:18', sender: 'Buyer', text: 'A screen replacement — even genuine — is material information that must be disclosed. You also said “no major repairs.” I’m filing a Return/Refund request.' },
      { timestamp: '2025-10-07 20:20', sender: 'AI', text: 'Return/Refund request received. Seller has 24 hours to: Accept / Decline / Counter-offer.\n\nTip:\n• Buyer — please upload Apple Support screenshots & comparison photos.\n• Seller — provide Apple service proof if available.' },
      { timestamp: '2025-10-07 20:24', sender: 'Buyer', text: '(uploads screenshot showing “Display – Genuine Apple Part (Replaced)” with matching IMEI)' },
      { timestamp: '2025-10-07 20:40', sender: 'Seller', text: 'I decline. It’s a genuine screen and you didn’t ask. I don’t see the issue.' },
      { timestamp: '2025-10-07 20:41', sender: 'AI', text: 'Seller has “Declined.” Buyer has 24h to accept an alternative or Raise to Carousell Support.\n\nTip:\n• If you wish to keep the item, consider a Partial refund.\n• If you prefer Return & Full, please confirm for case escalation.' },
      { timestamp: '2025-10-08 10:05', sender: 'Buyer', text: 'I want a Return & Full Refund. Non-disclosure of repair history is misleading. I’ll Raise to Support.' },
      { timestamp: '2025-10-08 10:06', sender: 'Buyer', text: '(clicks “Raise to Carousell Support”)' },

      // --- Copilot review & recommendation summary ---
      { timestamp: '2025-10-08 10:10', sender: 'AI', text: 'Preliminary finding — SNAD due to non-disclosure.\n\nRecommended:\nA) Return & Full Refund (Seller covers NT$60 + return label),\nOR\nB) Keep & Partial Refund (15–30%) if Buyer chooses to keep.\n\nPlease respond within 24h to avoid automatic escalation.' },

      // --- Resolution ---
      { timestamp: '2025-10-08 10:18', sender: 'Seller', text: 'Understood. If that’s the process, I’ll accept Return & Full Refund. I’ll reimburse the NT$60 and send the 7-ELEVEN return label today.' },
      { timestamp: '2025-10-08 10:22', sender: 'Buyer', text: 'Agreed. I’ll ship it back within 48h, record the packing video, and keep the receipt.' },
      { timestamp: '2025-10-08 10:23', sender: 'AI', text: 'Agreement recorded. System will generate return instructions for Buyer.' },
    ],
  },

  // =========================
  // CASE 2 — Shoes (Neutral)
  // =========================
  {
    id: 'case2',
    title: 'Nike Air Jordan 1 “University Blue” — US9',
    listingInfo: {
      title: 'Nike Air Jordan 1 Retro High OG “University Blue” — 100% Authentic',
      listedPrice: 'NT$5,200',
      condition: 'Like new (worn twice)',
      disclosedFlaws: 'Minor crease on toe box (photo 3), slightly dented box',
      attributes:
        'US9 (27cm), with original box & tag, purchased at Nike Taipei, 2023 release',
      photos: [
        { url: '/images/case%202/aj1_front.jpg', label: 'front view' },
        { url: '/images/case%202/aj1_side.jpg',  label: 'side profile' },
        { url: '/images/case%202/aj1_toe.jpg',   label: 'toe crease close-up' },
        { url: '/images/case%202/aj1_label.jpg', label: 'box label US9 / 27cm' },
      ],
      notes:
        'At listing time, neither party knew this model tends to fit 0.5 size smaller.',
    },
    orderMeta: [{ label: 'Order ID', value: 'TW-11021' }],
    complaint: 'Buyer says item fits like US8.5 though box says US9.',
    chatLog: [
      // Pre-transaction
      { timestamp: '2025-09-16 19:48', sender: 'Buyer', text: 'Hi! Is this pair still available? Looks really clean.' },
      { timestamp: '2025-09-16 19:51', sender: 'Seller', text: 'Yes, still available. Worn twice indoors, soles are very clean.' },
      { timestamp: '2025-09-16 19:53', sender: 'Buyer', text: 'Is the sizing true? I usually wear US9 for other Jordan 1s.' },
      { timestamp: '2025-09-16 19:56', sender: 'Seller', text: 'Yep, true US9. I wear US9 too and it fits snugly.' },
      { timestamp: '2025-09-16 20:01', sender: 'Buyer', text: 'Cool. If you can do NT$5,000, I’ll take it.' },
      { timestamp: '2025-09-16 20:03', sender: 'Seller', text: 'Deal.' },
      { timestamp: '2025-09-16 20:04', sender: 'Buyer', text: 'Ship via 7-ELEVEN COD, I’ll cover shipping.' },
      { timestamp: '2025-09-16 20:06', sender: 'Seller', text: 'Sure, COD fee is NT$60, paid at pickup.' },
      { timestamp: '2025-09-16 20:09', sender: 'Buyer', text: 'Send it to 7-ELEVEN Dunbei (Songshan), please.' },
      { timestamp: '2025-09-16 20:10', sender: 'Seller', text: 'Okay, I’ll ship tomorrow morning.' },
      { timestamp: '2025-09-16 21:12', sender: 'System', text: 'Order created (Order ID: TW-11021).' },

      // Post-delivery dispute
      { timestamp: '2025-09-19 09:40', sender: 'Buyer', text: 'I just tried them — they fit like US8.5, not US9. I want a return + refund.', highlight: true },
      { timestamp: '2025-09-19 10:10', sender: 'Seller', text: 'That’s strange. I also wear US9 and they fit me fine.' },
      { timestamp: '2025-09-19 10:18', sender: 'Buyer', text: 'They’re tighter than my other pairs. Can I send them back?' },

      // AI check
      { timestamp: '2025-09-19 10:20', sender: 'AI', text: 'Dispute received.\n→ Checking external product data for “Air Jordan 1 University Blue”…' },
      { timestamp: '2025-09-19 10:24', sender: 'AI', text: 'Sources indicate this model runs about 0.5 size smaller than standard AJ1s; many buyers report the same.\n→ Neither party is at fault (product characteristic).\n\nRecommendation:\nA) Return & Full Refund (Buyer covers NT$60 shipping)\nB) Keep item with a partial refund (~10%).' },

      // Resolution
      { timestamp: '2025-09-19 10:30', sender: 'Buyer', text: 'Oh, I see. Then it’s not your fault either.' },
      { timestamp: '2025-09-19 10:32', sender: 'Seller', text: 'I can refund NT$500 as goodwill if you keep them.' },
      { timestamp: '2025-09-19 10:35', sender: 'Buyer', text: 'That’s fair. I’ll keep them.' },
      { timestamp: '2025-09-19 10:36', sender: 'AI', text: 'Recorded — both parties agreed on partial refund (NT$500). Dispute resolved amicably.' },
    ],
  },

  // =========================
  // CASE 3 — Headphones (Neutral)
  // =========================
  {
    id: 'case3',
    title: 'Sony WH-1000XM4 — Like New (Black)',
    listingInfo: {
      title: 'Sony WH-1000XM4 Wireless Headphones — Like New',
      listedPrice: 'NT$4,200',
      condition: 'Like new (purchased late 2023)',
      disclosedFlaws: 'No box, includes carrying pouch (photo 3)',
      attributes:
        'Color Black, Bluetooth, Noise Cancelling, compatible with iPhone/Android',
      photos: [
        { url: '/images/case%203/xm4_overview.jpg', label: 'headphones + pouch overview' },
        { url: '/images/case%203/xm4_earcup.jpg',   label: 'close-up of right earcup' },
        { url: '/images/case%203/xm4_pouch.jpg',    label: 'carrying pouch' },
      ],
      notes:
        'Listing does not specify accessory completeness; buyer did not ask about cables.',
    },
    orderMeta: [{ label: 'Order ID', value: 'TW-12033' }],
    complaint: 'Missing USB-C cable after delivery; listing didn’t claim full set.',
    chatLog: [
      // Pre-transaction
      { timestamp: '2025-10-10 14:02', sender: 'Buyer', text: 'Hi! Are the headphones still available?' },
      { timestamp: '2025-10-10 14:05', sender: 'Seller', text: 'Yes, still available. Barely used, almost new.' },
      { timestamp: '2025-10-10 14:07', sender: 'Buyer', text: 'Are they working fine? Bluetooth and noise cancelling okay?' },
      { timestamp: '2025-10-10 14:09', sender: 'Seller', text: 'Everything works perfectly. Battery’s still strong.' },
      { timestamp: '2025-10-10 14:11', sender: 'Buyer', text: 'Okay. Do they come with any pouch or accessories?' },
      { timestamp: '2025-10-10 14:13', sender: 'Seller', text: 'Comes with the pouch shown in the photo, no box.' },
      { timestamp: '2025-10-10 14:15', sender: 'Buyer', text: 'Got it. Can do NT$4,000?' },
      { timestamp: '2025-10-10 14:16', sender: 'Seller', text: 'Sure, deal.' },
      { timestamp: '2025-10-10 14:18', sender: 'Buyer', text: 'Ship via 7-ELEVEN COD, I’ll pay the 60 TWD fee.' },
      { timestamp: '2025-10-10 14:19', sender: 'Seller', text: 'Okay, what store should I send it to?' },
      { timestamp: '2025-10-10 14:20', sender: 'Buyer', text: '7-ELEVEN Nanjing East (Zhongshan).' },
      { timestamp: '2025-10-10 14:21', sender: 'Seller', text: 'Great, I’ll ship tomorrow.' },
      { timestamp: '2025-10-10 14:22', sender: 'System', text: 'Order created (Order ID: TW-12033).' },

      // Order milestones
      { timestamp: '2025-10-11 09:30', sender: 'System', text: 'Seller shipped via 7-ELEVEN.' },
      { timestamp: '2025-10-12 10:15', sender: 'System', text: 'Arrived at pickup store (Nanjing East).' },
      { timestamp: '2025-10-12 19:20', sender: 'Buyer', text: 'Picked up & paid COD (NT$4,060). Thanks!' },

      // Dispute after receiving
      { timestamp: '2025-10-13 09:10', sender: 'Buyer', text: 'Just received the item — works fine, but no USB-C charging cable.\nListing and chat didn’t mention it’s missing, so I assumed it came with everything.\nI’d like to return it for a full refund.', highlight: true },
      { timestamp: '2025-10-13 09:25', sender: 'Seller', text: 'I only sold what’s in the photos. I used the cable for my phone so didn’t include it — thought everyone has one anyway.' },
      { timestamp: '2025-10-13 09:30', sender: 'Buyer', text: 'I see, but the original box usually includes one.' },

      // AI reasoning + suggestion
      { timestamp: '2025-10-13 09:35', sender: 'AI', text: 'Dispute logged.\n→ Reviewing listing & chat: no claim of “complete accessories.”\n→ Official Sony package includes a USB-C cable, but Buyer did not ask specifically.\n→ Preliminary finding: No clear fault (Neutral SNAD – lack of clarity on both sides).\n\nSuggested resolution:\nA) Return & Full Refund (Buyer covers 60 TWD shipping)\nOR\nB) Keep item and negotiate a small discount (~5–10% = 200–400 TWD).' },

      // Resolution
      { timestamp: '2025-10-13 09:40', sender: 'Buyer', text: 'Okay, if that’s the case, I’ll keep it — how about a 300 TWD refund?' },
      { timestamp: '2025-10-13 09:42', sender: 'Seller', text: 'Sure, I’ll refund 300 TWD to you.' },
      { timestamp: '2025-10-13 09:43', sender: 'AI', text: 'Agreement confirmed. Dispute closed – Partial refund 300 TWD.' },
    ],
  },
];