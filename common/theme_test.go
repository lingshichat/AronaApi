package common

import "testing"

func TestThemeDefaultsToDefaultFrontend(t *testing.T) {
	if got := GetTheme(); got != "default" {
		t.Fatalf("GetTheme() = %q, want %q", got, "default")
	}
}

func TestSetThemeIgnoresInvalidValue(t *testing.T) {
	original := GetTheme()
	t.Cleanup(func() {
		SetTheme(original)
	})

	SetTheme("classic")
	SetTheme("invalid")

	if got := GetTheme(); got != "classic" {
		t.Fatalf("GetTheme() = %q, want %q", got, "classic")
	}
}
