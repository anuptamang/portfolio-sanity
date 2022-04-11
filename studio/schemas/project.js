export default {
	name: 'project',
	title: 'Project',
	type: 'document',
	fields: [
		{
			name: 'title',
			title: 'Title',
			type: 'string',
		},
		{
			name: 'mainImage',
			title: 'Main image',
			type: 'image',
			options: {
				hotspot: true,
			},
		},
		{
			name: 'description',
			title: 'Description',
			type: 'blockContent',
		},
		{
			name: 'demoUrl',
			title: 'Demo Url',
			type: 'string',
		},
		{
			name: 'repoUrl',
			title: 'Repo Url',
			type: 'string',
		},
	],
}
