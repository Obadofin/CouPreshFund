const lessons = [
  {
    id: 'saving-vs-investing',
    title: 'Saving vs Investing',
    category: 'Financial Literacy',
    durationMinutes: 5,
    icon: 'growth',
    summary: 'Understand the difference between setting money aside and investing for potential growth.',
    content: [
      'Saving keeps money available for a near-term need or an emergency. A regulated savings account can help protect the amount you set aside, though returns may be modest.',
      'Investing means putting money into an asset that may grow over time, but its value can also fall. Investments are generally better suited to longer-term goals and money you can afford to leave invested.',
      'Before investing, build an emergency buffer, understand the risks and fees, and avoid offers that promise guaranteed high returns.',
    ],
  },
  {
    id: 'understanding-interest',
    title: 'Understanding Interest',
    category: 'Financial Literacy',
    durationMinutes: 6,
    icon: 'coins',
    summary: 'Learn how interest can add to savings or increase the cost of borrowing.',
    content: [
      'Interest is the cost of borrowing money or the return paid for saving or lending it. The rate, time, and compounding schedule all affect the total.',
      'With simple interest, returns are calculated on the original amount. With compound interest, returns can also earn returns over time.',
      'When comparing accounts or loans, check the effective rate, fees, repayment terms, and whether the rate can change.',
    ],
  },
  {
    id: 'budgeting-basics',
    title: 'Budgeting Basics',
    category: 'Financial Literacy',
    durationMinutes: 7,
    icon: 'wallet',
    summary: 'Build a simple plan for income, needs, goals, and flexible spending.',
    content: [
      'A budget is a plan for the money you expect to receive and spend over a period. Start by writing down income and regular expenses.',
      'Separate essential costs, savings goals, and optional spending. Review your actual expenses often and adjust the plan when your circumstances change.',
      'A budget is a guide, not a punishment. Small, consistent changes can help you make progress without assuming every month is the same.',
    ],
  },
  {
    id: 'the-50-30-20-rule',
    title: 'The 50/30/20 Rule',
    category: 'Financial Literacy',
    durationMinutes: 8,
    icon: 'target',
    summary: 'Explore a common way to group needs, wants, and savings.',
    content: [
      'The 50/30/20 rule is a starting point: about half of take-home income for needs, 30 percent for wants, and 20 percent for savings or debt repayment.',
      'These percentages are not strict requirements. Costs, income, and family responsibilities differ, so use categories that fit your own situation.',
      'Track spending for a few weeks, choose realistic targets, and review them regularly instead of relying on estimates.',
    ],
  },
  {
    id: 'managing-20000-for-a-week',
    title: 'How to manage ₦20,000 for an entire week',
    category: 'Financial Literacy',
    durationMinutes: 5,
    icon: 'book',
    summary: 'Practice planning a fixed amount across a week of likely expenses.',
    content: [
      'Start with known costs such as transport, meals, data, and school materials. Set aside these amounts before deciding what is flexible.',
      'Divide the remaining amount across the days or categories where you expect to spend it. Keep a small buffer for an unexpected essential.',
      'At the end of the week, compare the plan with your actual spending. Use what you learn to make next week’s estimate more realistic.',
    ],
  },
];

const publicLesson = ({ content, ...lesson }) => lesson;

module.exports = {
  lessons,
  publicLesson,
};
