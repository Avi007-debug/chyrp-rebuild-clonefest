import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

/**
 * A component that renders Markdown content with syntax highlighting for code blocks.
 * It uses react-syntax-highlighter with the 'atomDark' theme.
 */

const markdownComponents = {
    // This custom renderer targets <code> elements
    code({ node, inline, className, children, ...props }) {
        // Check for language className (e.g., "language-js")
        const match = /language-(\w+)/.exec(className || '');
        
        // If it's a block of code with a language, use SyntaxHighlighter
        return !inline && match ? (
            <SyntaxHighlighter
                style={atomDark}
                language={match[1]}
                PreTag="div"
                {...props}
            >
                {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
        ) : (
            // Otherwise, render as a normal inline code element
            <code className={className} {...props}>
                {children}
            </code>
        );
    }
};

const MarkdownRenderer = ({ content }) => {
    return <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>;
};

export default MarkdownRenderer;