// Year in Review content. Source: Figma LEO-pro-templates, "Year in Review carousel · v1 (LEO-2698)" (node 173:353). Sample data.
// Story size (9:16) also shows each page's facts: three small supporting figures (sample data).
// 10 pages: cover + one page per kept figure. The v1 end slide (proposed, not in the PRD) is left out.
window.YIR = {
  year: '2026',
  agent: { name: 'Aliana Williamson', brokerage: 'Real Broker US-NY, LLC', photo: 'assets/agent.jpg', cutout: 'assets/agent-cutout.png',
    poses: { crossed: 'assets/pose-crossed-cutout.png', laughPhoto: 'assets/pose-laugh.jpg', keys: 'assets/pose-keys-cutout.png', crossedPhoto: 'assets/pose-crossed.jpg', keysPhoto: 'assets/pose-keys.jpg', point: 'assets/pose-point-cutout.png' } },
  logo: 'assets/real-logo.svg',
  cover: { kicker: '2026 year in review', title: 'My year at Real', cta: 'Swipe →' },
  pages: [
    { id: '01', name: 'Cover' },
    { id: '02', name: 'Deals closed',     value: '38',       label: 'homes closed',               note: 'January to December 2026', facts: [['24','buyer sides'],['14','seller sides'],['3.2','homes a month']] },
    { id: '03', name: 'Total volume',     value: '$14.2M',   label: 'in total volume',            note: 'Across 38 closings this year', facts: [['$374K','average price'],['+18%','up from 2025'],['38','closings']] },
    { id: '04', name: 'Best month',       value: 'June',     label: 'my best month',              note: '7 homes closed in 30 days', facts: [['7','closings'],['$2.6M','volume in June'],['Q2','best quarter']] },
    { id: '05', name: 'Biggest deal',     value: '$2.1M',    label: 'my biggest sale',            note: 'Closed in Huntington, NY', facts: [['4','bedrooms'],['21','days on market'],['102%','of list price']] },
    { id: '06', name: 'Top city',         value: 'Melville', label: 'where I closed the most',    note: '12 closings in one town', facts: [['12','closings'],['$4.4M','volume there'],['32%','of my deals']] },
    { id: '07', name: 'Leaderboard',      value: 'Top 5%',   label: 'in New York',                note: 'Real Leaderboard, January to November', facts: [['#41','in the state'],['820','NY agents'],['+9','spots since June']] },
    { id: '08', name: 'Revenue share',    value: '$48K',     label: 'in revenue share',           note: 'Earned in calendar year 2026', facts: [['3','tiers earning'],['$4K','a month'],['+$31K','up from 2025']] },
    { id: '09', name: 'Cap',              value: 'Capped',   label: 'on August 14',               note: 'Reached my cap at Real in 2026', facts: [['$12K','cap paid'],['23','deals to cap'],['15','deals after cap']] },
    { id: '10', name: 'Agents recruited', value: '6',        label: 'agents joined Real with me', note: 'Front-line agents who joined in 2026', facts: [['4','from New York'],['2','from New Jersey'],['1','already capped']] },
  ],
};
