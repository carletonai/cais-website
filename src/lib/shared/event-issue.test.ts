import {
  captionBody,
  describeDraft,
  eventFromIssue,
  eventTitle,
  isEventForm,
  parseIssueForm,
  posterUrlIn,
  readDate,
  readTime,
  ticked,
} from "./event-issue.js";

const today = "2026-10-12";
const events = [
  {
    id: "66",
    title: "Intro to Agentic AI",
    date: "2026-10-09",
    instagram: "https://www.instagram.com/p/DeLVyDeOnbq/",
  },
  { id: "67", title: "Grok Bot Meetup – Ottawa", date: "2026-10-17" },
];
const context = { title: "Event: Machine Learning 101", today, events };

/** A submitted form, the way GitHub writes it into the issue body. */
const submission = (overrides: Record<string, string> = {}) => {
  const answers: Record<string, string> = {
    Date: "2026-10-23",
    "Last day": "_No response_",
    Time: "6:00 PM - 7:00 PM",
    Location: "Herzberg 5345",
    Type: "Workshop",
    Description:
      "Teach a model a rule from data instead of writing it yourself. Bring a laptop!",
    Tags: "- [x] beginner-friendly\n- [ ] hands-on\n- [X] technical\n- [ ] online",
    "RSVP or registration link": "_No response_",
    "Instagram post": "_No response_",
    Materials: "_No response_",
    Poster: "_No response_",
    ...overrides,
  };
  return Object.entries(answers)
    .map(([label, value]) => `### ${label}\n\n${value}\n`)
    .join("\n");
};

const caption = [
  "ML 101 is this Friday! 🧠",
  "📅 Friday, October 23",
  "🕕 6-7pm",
  "📍 Herzberg 5345",
  "Register: https://luma.com/ml101",
  "",
  "Teach a model a rule from data instead of writing it yourself.",
  "#carletonai #machinelearning",
].join("\n");

describe("parseIssueForm", () => {
  it("reads each answer under its heading and blanks the no-response marker", () => {
    const answers = parseIssueForm(submission());
    expect(answers["Date"]).toBe("2026-10-23");
    expect(answers["Last day"]).toBe("");
    expect(answers["Description"]).toMatch(/^Teach a model/);
    expect(answers["Tags"]).toContain("- [x] beginner-friendly");
  });

  it("keeps multi-line answers and copes with Windows line endings", () => {
    const body =
      "### Description\r\n\r\nLine one\r\n\r\nLine two\r\n\r\n### Poster\r\n\r\n_No response_\r\n";
    expect(parseIssueForm(body)).toEqual({
      Description: "Line one\n\nLine two",
      Poster: "",
    });
  });

  it("splits only on the form's own headings and drops HTML comments", () => {
    const body = submission({
      Description:
        "<!-- a note GitHub hid -->\n### Agenda\n\nTalks, then food.\n\n### Not a field",
    });
    const answers = parseIssueForm(body);
    expect(answers["Description"]).toBe(
      "### Agenda\n\nTalks, then food.\n\n### Not a field",
    );
    expect(answers["Agenda"]).toBeUndefined();
  });
});

test("isEventForm recognizes a submission by its headings", () => {
  expect(isEventForm(submission())).toBe(true);
  expect(isEventForm("Just a bug report with ### Steps")).toBe(false);
});

test("eventTitle takes the issue title after the form's prefix", () => {
  expect(eventTitle("Event: Machine Learning 101")).toBe(
    "Machine Learning 101",
  );
  expect(eventTitle("event:ML 101")).toBe("ML 101");
  expect(eventTitle("New event: ML 101")).toBe("ML 101");
  expect(eventTitle("ML 101")).toBe("ML 101");
  expect(eventTitle("Event: ")).toBe("");
});

test("ticked lists the boxes checked, in either case", () => {
  expect(ticked("- [x] a\n- [ ] b\n- [X] c")).toEqual(["a", "c"]);
  expect(ticked("")).toEqual([]);
});

describe("readDate", () => {
  it("takes ISO dates and dates with the month written out", () => {
    expect(readDate("2026-10-23", today)).toEqual({
      date: "2026-10-23",
      yearGiven: true,
    });
    expect(readDate("2026-1-5", today)).toEqual({
      date: "2026-01-05",
      yearGiven: true,
    });
    expect(readDate("October 23, 2026", today)).toEqual({
      date: "2026-10-23",
      yearGiven: true,
    });
    expect(readDate("Oct 23", today)).toEqual({
      date: "2026-10-23",
      yearGiven: false,
    });
  });

  it("rejects impossible dates and anything relative", () => {
    expect(readDate("2026-02-30", today)).toBeNull();
    expect(readDate("Friday", today)).toBeNull();
    expect(readDate("tomorrow", today)).toBeNull();
    expect(readDate("10/23/2026", today)).toBeNull();
    expect(readDate("soon", today)).toBeNull();
    expect(readDate("", today)).toBeNull();
  });
});

describe("readTime", () => {
  it("writes a plain time the way events.json does", () => {
    expect(readTime("6-7pm")).toEqual({
      time: "6:00 PM - 7:00 PM",
      normalized: true,
    });
    expect(readTime("6:30 PM")).toEqual({ time: "6:30 PM", normalized: true });
    expect(readTime("noon to 2pm")).toEqual({
      time: "12:00 PM - 2:00 PM",
      normalized: true,
    });
  });

  it("gives a range's end the period of its start, crossing noon when it must", () => {
    expect(readTime("6:00 PM - 7:00")).toEqual({
      time: "6:00 PM - 7:00 PM",
      normalized: true,
    });
    expect(readTime("11 AM - 1")).toEqual({
      time: "11:00 AM - 1:00 PM",
      normalized: true,
    });
  });

  it("reads 24-hour clock times", () => {
    expect(readTime("18:00")).toEqual({ time: "6:00 PM", normalized: true });
    expect(readTime("18:00 - 19:30")).toEqual({
      time: "6:00 PM - 7:30 PM",
      normalized: true,
    });
    expect(readTime("09:30-12:00")).toEqual({
      time: "9:30 AM - 12:00 PM",
      normalized: true,
    });
  });

  it("treats blank and TBA as all day", () => {
    expect(readTime("")).toEqual({ time: "", normalized: true });
    expect(readTime("TBA")).toEqual({ time: "", normalized: true });
  });

  it("keeps anything else as written", () => {
    const odd = "Sat 10:00 AM–4:30 PM, Sun 10:00 AM–1:00 PM";
    expect(readTime(odd)).toEqual({ time: odd, normalized: false });
    expect(readTime("25pm")).toEqual({ time: "25pm", normalized: false });
    expect(readTime("6:00 - 7:00")).toEqual({
      time: "6:00 - 7:00",
      normalized: false,
    });
  });
});

describe("captionBody", () => {
  it("drops the date, time, place and label lines of a pasted caption", () => {
    const kept = captionBody(caption, ["Herzberg 5345"])
      .split("\n")
      .filter(Boolean);
    expect(kept).toEqual([
      "ML 101 is this Friday! 🧠",
      "Teach a model a rule from data instead of writing it yourself.",
      "#carletonai #machinelearning",
    ]);
  });

  it("drops a one-line header and a pin line even when the place was typed differently", () => {
    const oneLine =
      "📅 Friday, October 23 🕕 6-7pm 📍 Herzberg 5345\nCome learn ML!\n📍 HP 5345";
    expect(captionBody(oneLine, ["Herzberg 5345", ""])).toBe("Come learn ML!");
    expect(captionBody("Oct 23 · 6-7pm · HP 5345\nSee you!", ["HP 5345"])).toBe(
      "See you!",
    );
  });

  it("leaves ordinary text alone", () => {
    expect(captionBody("Bring a laptop.\n\nSee you there!", [""])).toBe(
      "Bring a laptop.\n\nSee you there!",
    );
    expect(
      captionBody("Join us on October 23 at 6pm in Herzberg 5345.", [
        "Herzberg 5345",
      ]),
    ).toBe("Join us on October 23 at 6pm in Herzberg 5345.");
  });
});

describe("posterUrlIn", () => {
  it("finds the image GitHub attached, in Markdown or HTML", () => {
    const md =
      "![poster](https://github.com/user-attachments/assets/1234abcd-5678-90ef-aaaa-bbbbccccdddd)";
    expect(posterUrlIn(md)).toBe(
      "https://github.com/user-attachments/assets/1234abcd-5678-90ef-aaaa-bbbbccccdddd",
    );
    const html =
      '<img width="600" alt="poster" src="https://private-user-images.githubusercontent.com/1/2.jpg?jwt=abc" />';
    expect(posterUrlIn(html)).toBe(
      "https://private-user-images.githubusercontent.com/1/2.jpg?jwt=abc",
    );
  });

  it("fetches nothing from anywhere else", () => {
    expect(posterUrlIn("![x](https://example.com/evil.jpg)")).toBeNull();
    expect(
      posterUrlIn("http://github.com/user-attachments/assets/x"),
    ).toBeNull();
    expect(posterUrlIn("just words")).toBeNull();
    expect(posterUrlIn("")).toBeNull();
  });
});

describe("eventFromIssue", () => {
  it("drafts an event from a complete form, titled by the issue", () => {
    const result = eventFromIssue(parseIssueForm(submission()), {
      ...context,
      issueUrl: "https://github.com/carletonai/cais-website/issues/70",
    });
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.event).toEqual({
      id: "68",
      title: "Machine Learning 101",
      date: "2026-10-23",
      time: "6:00 PM - 7:00 PM",
      location: "Herzberg 5345",
      description:
        "Teach a model a rule from data instead of writing it yourself. Bring a laptop!",
      type: "Workshop",
      tags: ["beginner-friendly", "technical"],
      issue: "https://github.com/carletonai/cais-website/issues/70",
    });
    expect(result.posterUrl).toBeNull();
  });

  it("fills the time, place and RSVP link from a pasted caption when their fields are blank", () => {
    const result = eventFromIssue(
      parseIssueForm(
        submission({
          Time: "_No response_",
          Location: "_No response_",
          Description: caption,
        }),
      ),
      context,
    );
    expect(result.errors).toEqual([]);
    expect(result.event).toMatchObject({
      time: "6:00 PM - 7:00 PM",
      location: "Herzberg 5345",
      rsvpLink: "https://luma.com/ml101",
      description:
        "ML 101 is this Friday! Teach a model a rule from data instead of writing it yourself.",
    });
    expect(result.warnings.join(" ")).toMatch(/read from the description/);
  });

  it("keeps a time it cannot normalize and says so", () => {
    const odd = "Sat 10:00 AM–4:30 PM, Sun 10:00 AM–1:00 PM";
    const result = eventFromIssue(
      parseIssueForm(submission({ Time: odd })),
      context,
    );
    expect(result.event?.time).toBe(odd);
    expect(result.warnings.join(" ")).toMatch(/kept as written/);
  });

  it("treats a blank or TBA time as all day", () => {
    const blank = eventFromIssue(
      parseIssueForm(submission({ Time: "_No response_" })),
      context,
    );
    expect(blank.event?.time).toBe("");
    const tba = eventFromIssue(
      parseIssueForm(submission({ Time: "TBA" })),
      context,
    );
    expect(tba.event?.time).toBe("");
  });

  it("warns when the year had to be guessed", () => {
    const result = eventFromIssue(
      parseIssueForm(submission({ Date: "Oct 23" })),
      context,
    );
    expect(result.event?.date).toBe("2026-10-23");
    expect(result.warnings.join(" ")).toMatch(/write the year/);
  });

  it("takes the optional links, the last day and the poster", () => {
    const result = eventFromIssue(
      parseIssueForm(
        submission({
          "Last day": "2026-10-24",
          "RSVP or registration link": "https://luma.com/x",
          "Instagram post": "https://www.instagram.com/p/XYZ/",
          Materials: "https://github.com/carletonai/ml-101",
          Poster:
            "![poster](https://github.com/user-attachments/assets/1234abcd-5678-90ef-aaaa-bbbbccccdddd)",
        }),
      ),
      context,
    );
    expect(result.errors).toEqual([]);
    expect(result.event).toMatchObject({
      endDate: "2026-10-24",
      rsvpLink: "https://luma.com/x",
      instagram: "https://www.instagram.com/p/XYZ/",
      materials: "https://github.com/carletonai/ml-101",
    });
    expect(result.posterUrl).toMatch(/user-attachments/);
  });

  it("always carries the type's own tag, and reads tags from the words when none are ticked", () => {
    const ticked = eventFromIssue(
      parseIssueForm(
        submission({ Tags: "- [x] free-food\n- [ ] hands-on", Type: "Social" }),
      ),
      context,
    );
    expect(ticked.event?.tags).toEqual(["free-food", "social"]);
    const none = eventFromIssue(
      parseIssueForm(
        submission({
          Tags: "- [ ] beginner-friendly\n- [ ] hands-on",
          Type: "Social",
        }),
      ),
      context,
    );
    expect(none.event?.tags).toEqual(["hands-on", "social"]);
  });

  it("refuses tags the site does not use", () => {
    const result = eventFromIssue(
      parseIssueForm(
        submission({ Tags: "- [x] beginner-friendly\n- [x] vip" }),
      ),
      context,
    );
    expect(result.event).toBeNull();
    expect(result.errors.join(" ")).toMatch(
      /"vip", which the site does not use/,
    );
  });

  it("refuses a form it cannot make an event from, naming every problem", () => {
    const result = eventFromIssue(
      parseIssueForm(
        submission({
          Date: "next month",
          "RSVP or registration link": "luma.com/x",
          "Instagram post": "https://example.com/post",
          Materials: "http://insecure.example",
          Type: "Party",
        }),
      ),
      { ...context, title: "Event: " },
    );
    expect(result.event).toBeNull();
    expect(result.errors).toHaveLength(6);
    expect(result.errors.join("\n")).toMatch(
      /\*\*title\*\* is the event's title/,
    );
    expect(result.errors.join("\n")).toMatch(/Date\*\* could not be read/);
  });

  it("rejects a last day before the date and drops one equal to it", () => {
    const before = eventFromIssue(
      parseIssueForm(submission({ "Last day": "2026-10-22" })),
      context,
    );
    expect(before.errors.join(" ")).toMatch(/before the date/);
    const same = eventFromIssue(
      parseIssueForm(submission({ "Last day": "2026-10-23" })),
      context,
    );
    expect(same.errors).toEqual([]);
    expect(same.event?.endDate).toBeUndefined();
  });

  it("spots an event that is already on the site, however its post link was copied", () => {
    const byPost = eventFromIssue(
      parseIssueForm(
        submission({
          "Instagram post": "https://instagram.com/p/DeLVyDeOnbq?igsh=abc",
        }),
      ),
      context,
    );
    expect(byPost.errors.join(" ")).toMatch(/already on the site as event #66/);
    const byTitle = eventFromIssue(
      parseIssueForm(submission({ Date: "2026-10-17" })),
      { ...context, title: "Event: grok bot meetup, ottawa!" },
    );
    expect(byTitle.errors.join(" ")).toMatch(
      /already on the site as event #67/,
    );
  });

  it("allows a past date but says so, and warns about a poster box without an image", () => {
    const result = eventFromIssue(
      parseIssueForm(
        submission({ Date: "2026-09-24", Poster: "see attached" }),
      ),
      context,
    );
    expect(result.errors).toEqual([]);
    expect(result.warnings.join(" ")).toMatch(/has passed/);
    expect(result.warnings.join(" ")).toMatch(/No image was found/);
    expect(result.posterUrl).toBeNull();
  });
});

describe("describeDraft", () => {
  it("describes a draft for the pull request, closing the issue", () => {
    const result = eventFromIssue(parseIssueForm(submission()), {
      ...context,
      title: "Event: ML 101 | Part 1",
    });
    const text = describeDraft(result, { issueNumber: 70, poster: "attached" });
    expect(text).toContain("## Event drafted from #70");
    expect(text).toContain("| Title | ML 101 \\| Part 1 |");
    expect(text).toContain("| Poster | attached |");
    expect(text.trim().endsWith("Closes #70")).toBe(true);
  });

  it("lists what to fix when there is no draft", () => {
    const result = eventFromIssue(
      parseIssueForm(submission({ Date: "someday" })),
      context,
    );
    const text = describeDraft(result, { issueNumber: 70, poster: "none" });
    expect(text).toContain("## No event drafted yet");
    expect(text).toContain("could not be read");
    expect(text).not.toContain("Closes #70");
  });
});
