import React from 'react'
// import SyntaxHighlighter from 'react-syntax-highlighter'
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

      const ADDED = [1, 2, 3]
      const REMOVED = [6]

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
            } else if (REMOVED.includes(lineNumber)) {
              style.backgroundColor = 'rgb(146 11 11 / 50%)'
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
