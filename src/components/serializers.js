import React from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { nord } from 'react-syntax-highlighter/dist/esm/styles/prism'

const serializers = {
  types: {
    authorReference: ({ node }) => <span>{node.author.name}</span>,
    code: ({ node = {} }) => {
      const { code, language, highlightedLines } = node

      console.log(highlightedLines)
      if (!code) {
        return null
      }

      return (
        <SyntaxHighlighter
          showLineNumbers
          style={nord}
          language={language || 'text'}
          wrapLines={true}
          lineProps={(lineNumber) => {
            let style = { display: 'block' }
            if (highlightedLines?.includes(lineNumber)) {
              style.backgroundColor = 'rgb(14 150 14 / 50%)'
            }
            return { style }
          }}
        >
          {code}
        </SyntaxHighlighter>
      )
    },
  },
}

export default serializers
