"use client";

import { signOut } from "next-auth/react";
import { Button } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";

export default function LogoutButton() {
  return (
    <Button
      variant="outlined"
      color="error"
      size="small"
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      Logout
    </Button>
  );
}
