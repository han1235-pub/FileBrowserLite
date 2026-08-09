public class BrowserResponse
{
    public string? CurrentPath { get; set; }
    public List<FileItem> Items { get; set; } = new();
    public FolderSummary Summary { get; set; } = new();
}