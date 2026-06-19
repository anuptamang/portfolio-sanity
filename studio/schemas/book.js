export default {
  name: "book",
  title: "Book",
  type: "document",
  fields: [
    {
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: "cover",
      title: "Cover",
      type: "image",
      options: {
        hotspot: true,
      },
    },
    {
      name: "authors",
      title: "Author(s)",
      type: "array",
      of: [{ type: "reference", to: { type: "bookAuthor" } }],
    },
    {
      name: "categories",
      title: "Categories",
      type: "array",
      of: [{ type: "reference", to: { type: "bookCategory" } }],
    },
    {
      name: "publishedYear",
      title: "First Published Year",
      type: "number",
      validation: (Rule) =>
        Rule.min(0).max(new Date().getFullYear() + 1).integer(),
    },
    {
      name: "latestEditionYear",
      title: "Latest Edition Year",
      type: "number",
      validation: (Rule) =>
        Rule.min(0).max(new Date().getFullYear() + 1).integer(),
    },
    {
      name: "pages",
      title: "Page Count",
      type: "number",
      validation: (Rule) => Rule.min(0).integer(),
    },
    {
      name: "isbn",
      title: "ISBN",
      type: "string",
    },
    {
      name: "edition",
      title: "Edition / Version",
      type: "string",
      description: 'e.g. "2nd ed.", "Revised edition"',
    },
    {
      name: "volume",
      title: "Volume (if part of a series)",
      type: "object",
      fields: [
        {
          name: "volumeNumber",
          title: "Volume Number",
          type: "string",
          description: 'e.g. "Vol. 2"',
        },
        {
          name: "originalWork",
          title: "Original Work / Series",
          type: "string",
          description: "Name of the original work or series this belongs to",
        },
      ],
      options: {
        collapsible: true,
        collapsed: true,
      },
    },
    {
      name: "tableOfContents",
      title: "Table of Contents",
      type: "blockContent",
    },
    {
      name: "summary",
      title: "Summary",
      type: "blockContent",
    },
    {
      name: "pdfLinks",
      title: "PDF Links",
      type: "array",
      description: "Links to read or download the book (shown as Read Book on the detail page).",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "label",
              title: "Label",
              type: "string",
              description: 'e.g. "Read PDF", "Download"',
              initialValue: "Read Book",
            },
            {
              name: "url",
              title: "URL",
              type: "url",
              validation: (Rule) => Rule.required().uri({ scheme: ["http", "https"] }),
            },
          ],
          preview: {
            select: { title: "label", subtitle: "url" },
          },
        },
      ],
    },
    {
      name: "audioLinks",
      title: "Audio Links",
      type: "array",
      description: "Audiobook or audio broadcast links (shown as Listen on the detail page).",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "label",
              title: "Label",
              type: "string",
              description: 'e.g. "Listen on LibriVox", "YouTube Audiobook"',
              initialValue: "Listen",
            },
            {
              name: "url",
              title: "URL",
              type: "url",
              validation: (Rule) => Rule.required().uri({ scheme: ["http", "https"] }),
            },
          ],
          preview: {
            select: { title: "label", subtitle: "url" },
          },
        },
      ],
    },
  ],
  preview: {
    select: {
      title: "title",
      year: "publishedYear",
      media: "cover",
    },
    prepare(selection) {
      const { title, year, media } = selection;
      return {
        title,
        subtitle: year ? `${year}` : undefined,
        media,
      };
    },
  },
};
