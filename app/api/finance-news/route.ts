export const runtime = "nodejs"; // IMPORTANT: Node runtime

import Parser from "rss-parser";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const parser = new Parser();
    const feed = await parser.parseURL("https://www.cnbc.com/id/100003114/device/rss/rss.html");

    const items = feed.items.map((item) => ({
      title: item.title ?? "No title",
      link: item.link ?? "#",
    }));

    return NextResponse.json(items);
  } catch (err) {
    console.error("Error fetching finance news:", err);
    return NextResponse.json([], { status: 500 });
  }
}