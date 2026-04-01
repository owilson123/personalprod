import Parser from "rss-parser";

export async function GET() {

  const parser = new Parser();
  const feed = await parser.parseURL(
    "http://feeds.bbci.co.uk/news/rss.xml"
  );

  const items = feed.items.slice(0, 10).map(item => ({
    title: item.title,
    link: item.link
  }));

  return Response.json(items);

}