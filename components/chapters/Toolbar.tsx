"use client";

import { Editor } from "@tiptap/react";
import {
  FormatBold,
  FormatItalic,
  FormatStrikethrough,
  Code,
  FormatListBulleted,
  FormatListNumbered,
  FormatQuote,
  HorizontalRule,
  FormatClear,
} from "@mui/icons-material";
import { ToggleButton, ToggleButtonGroup, Divider } from "@mui/material";

interface ToolbarProps {
  editor: Editor;
}

export default function Toolbar({ editor }: ToolbarProps) {
  return (
    <ToggleButtonGroup
      size="small"
      aria-label="text formatting"
      sx={{
        p: 1,
        border: "1px solid",
        borderColor: "divider",
        borderBottom: 0,
        borderRadius: "4px 4px 0 0",
        bgcolor: "action.hover",
        flexWrap: "wrap",
      }}
    >
      <ToggleButton
        value="bold"
        aria-label="bold"
        onClick={() => editor.chain().focus().toggleBold().run()}
        selected={editor.isActive("bold")}
      >
        <FormatBold />
      </ToggleButton>
      <ToggleButton
        value="italic"
        aria-label="italic"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        selected={editor.isActive("italic")}
      >
        <FormatItalic />
      </ToggleButton>
      <ToggleButton
        value="strike"
        aria-label="strike"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        selected={editor.isActive("strike")}
      >
        <FormatStrikethrough />
      </ToggleButton>
      <Divider flexItem orientation="vertical" sx={{ mx: 0.5, my: 1 }} />
      <ToggleButton
        value="bulletList"
        aria-label="bullet list"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        selected={editor.isActive("bulletList")}
      >
        <FormatListBulleted />
      </ToggleButton>
      <ToggleButton
        value="orderedList"
        aria-label="ordered list"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        selected={editor.isActive("orderedList")}
      >
        <FormatListNumbered />
      </ToggleButton>
      <Divider flexItem orientation="vertical" sx={{ mx: 0.5, my: 1 }} />
      <ToggleButton
        value="blockquote"
        aria-label="blockquote"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        selected={editor.isActive("blockquote")}
      >
        <FormatQuote />
      </ToggleButton>
      <ToggleButton
        value="horizontalRule"
        aria-label="horizontal rule"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <HorizontalRule />
      </ToggleButton>
    </ToggleButtonGroup>
  );
}

