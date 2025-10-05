// components/iat/TiptapEditor.tsx
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import { useMemo } from "react";
import StarterKit from "@tiptap/starter-kit";
import {
  Box,
  Button,
  ButtonGroup,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
} from "@mui/material";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatStrikethroughIcon from "@mui/icons-material/FormatStrikethrough";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import CodeIcon from "@mui/icons-material/Code";
import FormatColorTextIcon from "@mui/icons-material/FormatColorText";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import FontFamily from "@tiptap/extension-font-family";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";

interface MenuBarProps {
  editor: Editor | null;
}

const MenuBar = ({ editor }: MenuBarProps) => {
  if (!editor) {
    return null;
  }

  // Gunakan useMemo untuk menstabilkan nilai dari getAttributes
  const activeFontFamily = useMemo(() => {
    if (editor.isActive("textStyle", { fontFamily: "Inter" })) {
      return "Inter";
    }
    return editor.getAttributes("textStyle").fontFamily || "Inter";
    // Bergantung pada editor.state untuk mendeteksi perubahan
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor.state]);

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 0.5,
        borderBottom: 1,
        borderColor: "divider",
        p: 1,
      }}
    >
      <ButtonGroup size="small" variant="outlined">
        <Button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          sx={{
            backgroundColor: editor.isActive("bold")
              ? "action.selected"
              : "transparent",
          }}
        >
          <FormatBoldIcon fontSize="small" />
        </Button>
        <Button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          sx={{
            backgroundColor: editor.isActive("italic")
              ? "action.selected"
              : "transparent",
          }}
        >
          <FormatItalicIcon fontSize="small" />
        </Button>
        <Button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          sx={{
            backgroundColor: editor.isActive("strike")
              ? "action.selected"
              : "transparent",
          }}
        >
          <FormatStrikethroughIcon fontSize="small" />
        </Button>
      </ButtonGroup>
      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
      <ButtonGroup size="small" variant="outlined">
        <Button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          sx={{
            backgroundColor: editor.isActive("blockquote")
              ? "action.selected"
              : "transparent",
          }}
        >
          <FormatQuoteIcon fontSize="small" />
        </Button>
        <Button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          sx={{
            backgroundColor: editor.isActive("codeBlock")
              ? "action.selected"
              : "transparent",
          }}
        >
          <CodeIcon fontSize="small" />
        </Button>
      </ButtonGroup>
      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
      <FormControl size="small" sx={{ minWidth: 120, mr: 1 }}>
        <InputLabel id="font-family-label">Font</InputLabel>
        <Select
          labelId="font-family-label"
          label="Font"
          value={activeFontFamily}
          onChange={(e) =>
            editor.chain().focus().setFontFamily(e.target.value).run()
          }
        >
          <MenuItem value="Inter">
            <Typography sx={{ fontFamily: "Inter" }}>Inter</Typography>
          </MenuItem>
          <MenuItem value="Roboto">
            <Typography sx={{ fontFamily: "Roboto" }}>Roboto</Typography>
          </MenuItem>
          <MenuItem value="Georgia">
            <Typography sx={{ fontFamily: "Georgia" }}>Georgia</Typography>
          </MenuItem>
          <MenuItem value="'Courier New'">
            <Typography sx={{ fontFamily: "'Courier New'" }}>
              Courier New
            </Typography>
          </MenuItem>
        </Select>
      </FormControl>
      <ButtonGroup size="small" variant="outlined">
        <Button component="label" sx={{ px: 0.5 }}>
          <FormatColorTextIcon fontSize="small" />
          <input
            type="color"
            onInput={(event) =>
              editor
                .chain()
                .focus()
                .setColor((event.target as HTMLInputElement).value)
                .run()
            }
            value={editor.getAttributes("textStyle").color || "#000000"}
            style={{
              width: 0,
              height: 0,
              padding: 0,
              border: "none",
              position: "absolute",
              opacity: 0,
            }}
          />
        </Button>
        <Button onClick={() => editor.chain().focus().unsetColor().run()}>
          Reset
        </Button>
      </ButtonGroup>
      <ButtonGroup size="small" variant="outlined" sx={{ ml: 0.5 }}>
        <Button component="label" sx={{ px: 0.5 }}>
          <BorderColorIcon fontSize="small" />
          <input
            type="color"
            onInput={(event) =>
              editor
                .chain()
                .focus()
                .toggleHighlight({
                  color: (event.target as HTMLInputElement).value,
                })
                .run()
            }
            value={editor.getAttributes("highlight").color || "#FFFFFF"}
            style={{
              width: 0,
              height: 0,
              padding: 0,
              border: "none",
              position: "absolute",
              opacity: 0,
            }}
          />
        </Button>
        <Button
          onClick={() => editor.chain().focus().unsetHighlight().run()}
          disabled={!editor.isActive("highlight")}
        >
          Reset
        </Button>
      </ButtonGroup>
    </Box>
  );
};

interface TiptapEditorProps {
  content: string;
  onChange: (htmlContent: string) => void;
}

const TiptapEditor = ({ content, onChange }: TiptapEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      FontFamily,
      Color,
      Highlight.configure({ multicolor: true }),
    ],
    content: content,
    immediatelyRender: false, // Tambahkan ini untuk menghindari hydration error
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "tiptap-editor",
      },
    },
  });

  return (
    <Box
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        overflow: "hidden",
      }}
    >
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
      <style jsx global>{`
        .tiptap-editor {
          padding: 8px;
          min-height: 60px;
          outline: none;
        }
        .tiptap-editor p {
          margin: 0;
        }
        .tiptap-editor blockquote {
          border-left: 3px solid rgba(0, 0, 0, 0.1);
          margin-left: 1rem;
          padding-left: 1rem;
        }
        .tiptap-editor pre {
          background: #0d0d0d;
          color: #fff;
          font-family: "JetBrainsMono", monospace;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
        }
        .tiptap-editor pre code {
          color: inherit;
          padding: 0;
          background: none;
          font-size: 0.8rem;
        }
      `}</style>
    </Box>
  );
};

export default TiptapEditor;
