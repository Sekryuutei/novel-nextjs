import Link from "next/link";
import { getServerSession } from "next-auth";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Avatar,
} from "@mui/material";
import BookIcon from "@mui/icons-material/Book";
import { authOptions } from "@/lib/auth";
import LogoutButton from "../auth/LogoutButton";

export default async function Navbar() {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="logo"
          component={Link}
          href="/"
        >
          <BookIcon />
        </IconButton>
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, textDecoration: "none", color: "inherit" }}
          as={Link}
          href="/"
        >
          Novel Interaktif
        </Typography>

        {user ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Button
              component={Link}
              href="/dashboard/novels"
              variant="outlined"
              size="small"
            >
              Dashboard
            </Button>
            <Typography variant="body2">
              Halo, {user.name || user.email}
            </Typography>
            <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
              {user.name?.charAt(0).toUpperCase() ||
                user.email?.charAt(0).toUpperCase()}
            </Avatar>
            <LogoutButton />
          </Box>
        ) : (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button component={Link} href="/auth/login" color="primary">
              Login
            </Button>
            <Button
              component={Link}
              href="/auth/register"
              variant="contained"
              color="primary"
            >
              Register
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
