export default {
  name: "bookAuthor",
  title: "Book Author",
  type: "document",
  fields: [
    {
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "name",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: "photo",
      title: "Photo",
      type: "image",
      options: {
        hotspot: true,
      },
    },
    {
      name: "nationality",
      title: "Nationality",
      type: "string",
    },
    {
      name: "description",
      title: "Short Description",
      type: "string",
      description: "One-line descriptor, e.g. “American investor and author”.",
    },
    {
      name: "website",
      title: "Website",
      type: "url",
    },
    {
      name: "wikipediaUrl",
      title: "Wikipedia URL",
      type: "url",
    },
    {
      name: "bio",
      title: "Biography",
      type: "blockContent",
      description: "Lead section — overview of life and significance.",
    },
    {
      name: "career",
      title: "Career & Work",
      type: "blockContent",
      description: "Professional life, major works, and contributions.",
    },
    {
      name: "achievements",
      title: "Achievements & Legacy",
      type: "blockContent",
      description: "Awards, honours, influence, and lasting impact.",
    },
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "nationality",
      media: "photo",
    },
  },
};
