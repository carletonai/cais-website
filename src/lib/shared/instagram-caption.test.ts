import {
  dateIn,
  isRecap,
  locationIn,
  parseCaption,
  timeIn,
  titleIn,
} from "./instagram-caption.js";

// Ottawa, the afternoon of Thursday, October 1, 2026.
const posted = new Date("2026-10-01T16:00:00-04:00");

describe("dateIn", () => {
  it.each([
    ["Join us Friday, October 9 at 6pm", "2026-10-09"],
    ["Oct 9th, 6-7pm", "2026-10-09"],
    ["9 October — see you there", "2026-10-09"],
    ["Sept 24th icebreaker (yes, it already happened)", "2026-09-24"],
    ["Workshop on 2026-11-03", "2026-11-03"],
    ["Save the date: January 15!", "2027-01-15"],
    ["Mark your calendars for March 21, 2027", "2027-03-21"],
    ["tonight at 7", "2026-10-01"],
    ["tomorrow in Herzberg", "2026-10-02"],
    ["this Friday at 5:30pm", "2026-10-02"],
    ["this Thursday (posted on a Thursday means today)", "2026-10-01"],
    ["Monday meetup", "2026-10-05"],
    ["next Thursday", "2026-10-08"],
    ["Applications are open!", null],
  ])("reads %j", (text, date) => {
    expect(dateIn(text, "2026-10-01")).toBe(date);
  });
});

describe("timeIn", () => {
  it.each([
    ["from 6:00-7:00 PM", "6:00 PM - 7:00 PM"],
    ["6-8pm", "6:00 PM - 8:00 PM"],
    ["6–10pm", "6:00 PM - 10:00 PM"],
    ["11-1pm", "11:00 AM - 1:00 PM"],
    ["10am to 4:30pm", "10:00 AM - 4:30 PM"],
    ["doors at 5:30 p.m.", "5:30 PM"],
    ["noon in the quad", "12:00 PM"],
    ["@ 7pm", "7:00 PM"],
    ["Room 3228", ""],
    ["", ""],
  ])("reads %j as %j", (text, expected) => {
    expect(timeIn(text)).toBe(expected);
  });
});

describe("locationIn", () => {
  it.each([
    ["📍 CS Seminar Room, Herzberg", "CS Seminar Room, Herzberg"],
    ["Location: Richcraft Hall 3228!", "Richcraft Hall 3228"],
    ["Meet us in Nicol Building room 2020 at 6", "Nicol Building 2020"],
    ["Herzberg 5345, bring a laptop", "Herzberg 5345"],
    ["We're going live on Zoom", "Online"],
    ["Great prizes await", ""],
  ])("reads %j", (text, expected) => {
    expect(locationIn(text)).toBe(expected);
  });
});

describe("titleIn", () => {
  it("takes the first real line, without emoji, tags or a trailing bang", () => {
    expect(titleIn("🚀 Intro to Agentic AI 🚀\nFriday Oct 9 · 6pm")).toBe(
      "Intro to Agentic AI",
    );
    expect(titleIn("Friday, October 9\nGrok Bot Meetup – Ottawa!\n#cais")).toBe(
      "Grok Bot Meetup – Ottawa",
    );
    expect(titleIn("Machine Learning Workshop | with @hackthehill")).toBe(
      "Machine Learning Workshop",
    );
    expect(
      titleIn("Grok Bot Meetup – Ottawa 🤝 with @builderscollectiveottawa"),
    ).toBe("Grok Bot Meetup – Ottawa");
  });
});

test("isRecap spots posts about what already happened", () => {
  expect(isRecap("Thanks for coming out last night, what a turnout!")).toBe(
    true,
  );
  expect(isRecap("Come out Friday for our first workshop")).toBe(false);
});

describe("parseCaption", () => {
  it("turns an announcement into a draft event", () => {
    const parsed = parseCaption(
      [
        "🚀 Intro to Agentic AI 🚀",
        "Join us Friday, October 9 from 6:00-7:00 PM in Herzberg 5345 to learn how AI agents plan, use tools and get work done. Bring a laptop, no experience needed!",
        "Free pizza 🍕",
        "Register: https://luma.com/abc123",
        "#cais #carleton #ai",
      ].join("\n"),
      { postedAt: posted },
    );
    expect(parsed).toMatchObject({
      title: "Intro to Agentic AI",
      date: "2026-10-09",
      time: "6:00 PM - 7:00 PM",
      location: "Herzberg 5345",
      type: "Workshop",
      rsvpLink: "https://luma.com/abc123",
      isEvent: true,
      recap: false,
      confidence: "high",
    });
    expect(parsed.tags).toEqual(
      expect.arrayContaining([
        "free-food",
        "beginner-friendly",
        "hands-on",
        "technical",
      ]),
    );
    expect(parsed.description).toMatch(/^Intro to Agentic AI Join us Friday/);
    expect(parsed.description).not.toMatch(/https?:|#cais|Register:/);
    expect(parsed.description).toMatch(/Free pizza$/);
  });

  it("knows a recap is not an upcoming event", () => {
    const parsed = parseCaption(
      "Thanks for coming to our icebreaker on Sept 24! What a turnout 🎉",
      { postedAt: posted },
    );
    expect(parsed.recap).toBe(true);
    expect(parsed.isEvent).toBe(false);
  });

  it("is only as sure as the caption lets it be", () => {
    const parsed = parseCaption("Exec applications close Oct 15, apply now", {
      postedAt: posted,
    });
    expect(parsed.date).toBe("2026-10-15");
    expect(parsed.isEvent).toBe(false);
    const vague = parseCaption("See you there Friday!", { postedAt: posted });
    expect(vague.isEvent).toBe(true);
    expect(vague.confidence).toBe("low");
  });
});
