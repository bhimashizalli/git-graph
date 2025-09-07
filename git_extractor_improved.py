#!/usr/bin/env python3
"""
Git Repository Data Extractor for Visualization - FIXED VERSION
=============================================================

This script extracts git repository data and formats it for use in visualization tools
like Figma, or custom web applications.

Usage: python git_extractor_fixed.py [repository_path] [output_format]
"""

import subprocess
import json
import csv
import sys
import os
from datetime import datetime
from collections import defaultdict

class GitDataExtractor:
    def __init__(self, repo_path="."):
        self.repo_path = repo_path

    def extract_branch_info(self):
        """Extract information about all branches"""
        try:
            # Get all branches including remote branches
            result = subprocess.run(['git', 'branch', '-a'], 
                                  cwd=self.repo_path, capture_output=True, text=True)

            if result.returncode != 0:
                print(f"Error running git branch: {result.stderr}")
                return []

            branches = []
            branch_lines = [line.strip() for line in result.stdout.split('\n') if line.strip()]

            for line in branch_lines:
                # Remove the * indicator for current branch
                branch_name = line.replace('*', '').strip()

                # Skip HEAD detached state
                if '(HEAD detached' in branch_name or '->' in branch_name:
                    continue

                # Determine branch type and clean name
                if branch_name.startswith('remotes/origin/'):
                    clean_name = branch_name.replace('remotes/origin/', '')
                    branch_type = 'remote'
                elif branch_name.startswith('origin/'):
                    clean_name = branch_name.replace('origin/', '')
                    branch_type = 'remote'
                else:
                    clean_name = branch_name
                    branch_type = 'local'

                # Skip if we already have this branch name
                if any(b['name'] == clean_name for b in branches):
                    continue

                # Get last commit info for this branch
                try:
                    commit_result = subprocess.run(['git', 'log', branch_name, '-1', '--format=%H|%an|%ai|%s'], 
                                                 cwd=self.repo_path, capture_output=True, text=True)

                    if commit_result.returncode == 0 and commit_result.stdout.strip():
                        parts = commit_result.stdout.strip().split('|', 3)
                        if len(parts) >= 4:
                            branches.append({
                                'name': clean_name,
                                'type': branch_type,
                                'last_commit_hash': parts[0],
                                'last_author': parts[1],
                                'last_date': parts[2],  # Using ISO format (%ai)
                                'last_message': parts[3]
                            })
                except Exception as e:
                    print(f"Warning: Could not get commit info for branch {branch_name}: {e}")
                    continue

            return branches
        except Exception as e:
            print(f"Error extracting branch info: {e}")
            return []

    def extract_commit_graph(self, all_branches=True):
        """Extract commit graph data for visualization - improved version"""
        try:
            # Use ISO date format and get more comprehensive data
            cmd = ['git', 'log', '--format=%H|%P|%an|%ai|%s|%D']
            if all_branches:
                cmd.append('--all')

            result = subprocess.run(cmd, cwd=self.repo_path, capture_output=True, text=True)

            if result.returncode != 0:
                print(f"Error running git log: {result.stderr}")
                return []

            lines = result.stdout.strip().split('\n')
            commits = []

            for line in lines:
                if not line.strip():
                    continue

                parts = line.split('|', 5)
                if len(parts) >= 5:
                    commit_hash = parts[0]
                    parents = parts[1].split() if parts[1] else []
                    author = parts[2]
                    date_iso = parts[3]  # ISO format date
                    message = parts[4]
                    refs = parts[5] if len(parts) > 5 else ''

                    # Determine which branch this commit belongs to
                    branch_name = self.determine_branch_from_refs(refs, commit_hash)

                    commits.append({
                        'hash': commit_hash,
                        'parents': parents,
                        'author': author,
                        'date': date_iso,  # ISO format for easier parsing
                        'message': message,
                        'refs': refs,
                        'branch': branch_name
                    })

            return commits
        except Exception as e:
            print(f"Error extracting commit graph: {e}")
            return []

    def determine_branch_from_refs(self, refs, commit_hash):
        """Determine the primary branch for a commit based on refs"""
        if not refs:
            return 'main'  # Default fallback

        # Priority order for branch detection
        branch_priorities = ['main', 'master', 'develop', 'dev']

        # Extract branch names from refs
        branch_names = []
        for ref in refs.split(', '):
            ref = ref.strip()
            if ref.startswith('origin/'):
                branch_names.append(ref.replace('origin/', ''))
            elif '/' not in ref and ref not in ['HEAD', 'tag']:
                branch_names.append(ref)

        # Return highest priority branch
        for priority_branch in branch_priorities:
            if priority_branch in branch_names:
                return priority_branch

        # Return first branch found, or main as fallback
        return branch_names[0] if branch_names else 'main'

    def extract_merge_data(self):
        """Extract merge commit information"""
        try:
            result = subprocess.run(['git', 'log', '--merges', '--format=%H|%P|%s|%an|%ai'], 
                                  cwd=self.repo_path, capture_output=True, text=True)

            if result.returncode != 0:
                print(f"Error running git log for merges: {result.stderr}")
                return []

            lines = result.stdout.strip().split('\n')
            merges = []

            for line in lines:
                if line.strip() and '|' in line:
                    parts = line.split('|', 4)
                    if len(parts) >= 5:
                        merges.append({
                            'hash': parts[0],
                            'parents': parts[1].split(),
                            'message': parts[2],
                            'author': parts[3],
                            'date': parts[4]  # ISO format
                        })

            return merges
        except Exception as e:
            print(f"Error extracting merge data: {e}")
            return []

    def get_repo_name(self):
        """Extract just the repository name from the path"""
        try:
            # Try to get the repo name from git config
            result = subprocess.run(['git', 'config', '--get', 'remote.origin.url'], 
                                  cwd=self.repo_path, capture_output=True, text=True)

            if result.returncode == 0 and result.stdout.strip():
                url = result.stdout.strip()
                # Extract repo name from URL (handles both SSH and HTTPS)
                if url.endswith('.git'):
                    url = url[:-4]
                repo_name = url.split('/')[-1]
                return repo_name
            else:
                # Fallback to directory name
                return os.path.basename(os.path.abspath(self.repo_path))
        except Exception:
            return os.path.basename(os.path.abspath(self.repo_path))

    def export_to_json(self, output_file='git_data.json'):
        """Export all git data to JSON format"""
        branches = self.extract_branch_info()
        commits = self.extract_commit_graph()
        merges = self.extract_merge_data()

        data = {
            'repository_info': {
                'name': self.get_repo_name(),  # Just repo name, not full path
                'path': self.repo_path,
                'extraction_date': datetime.now().isoformat(),
                'total_branches': len(branches),
                'total_commits': len(commits),
                'total_merges': len(merges)
            },
            'branches': branches,
            'commits': commits,
            'merges': merges
        }

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        print(f"Git data exported to {output_file}")
        print(f"Repository: {data['repository_info']['name']}")
        print(f"Branches: {len(branches)}, Commits: {len(commits)}, Merges: {len(merges)}")
        return data

    def export_to_csv(self, output_prefix='git_data'):
        """Export git data to CSV files for easy import into visualization tools"""

        # Export branches
        branches = self.extract_branch_info()
        if branches:
            with open(f'{output_prefix}_branches.csv', 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=['name', 'type', 'last_commit_hash', 'last_author', 'last_date', 'last_message'])
                writer.writeheader()
                writer.writerows(branches)
            print(f"Branches exported to {output_prefix}_branches.csv ({len(branches)} branches)")

        # Export commits
        commits = self.extract_commit_graph()
        if commits:
            with open(f'{output_prefix}_commits.csv', 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=['hash', 'parents', 'author', 'date', 'message', 'refs', 'branch'])
                writer.writeheader()
                for commit in commits:
                    commit['parents'] = ' '.join(commit['parents'])  # Convert list to string for CSV
                    writer.writerow(commit)
            print(f"Commits exported to {output_prefix}_commits.csv ({len(commits)} commits)")

        # Export merges
        merges = self.extract_merge_data()
        if merges:
            with open(f'{output_prefix}_merges.csv', 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=['hash', 'parents', 'message', 'author', 'date'])
                writer.writeheader()
                for merge in merges:
                    merge['parents'] = ' '.join(merge['parents'])  # Convert list to string for CSV
                    writer.writerow(merge)
            print(f"Merges exported to {output_prefix}_merges.csv ({len(merges)} merges)")

def main():
    repo_path = sys.argv[1] if len(sys.argv) > 1 else "."
    output_format = sys.argv[2] if len(sys.argv) > 2 else "json"

    print("Git Repository Data Extractor - IMPROVED VERSION")
    print("=" * 55)

    # Check if the path is a valid git repository
    if not os.path.exists(os.path.join(repo_path, '.git')):
        print(f"Error: {repo_path} is not a git repository")
        print("\nMake sure you're pointing to a directory that contains a .git folder")
        sys.exit(1)

    print(f"Extracting data from repository: {repo_path}")
    print(f"Output format: {output_format}")
    print()

    # Create the extractor instance
    extractor = GitDataExtractor(repo_path)

    # Execute based on format
    try:
        if output_format.lower() == 'json':
            data = extractor.export_to_json()

        elif output_format.lower() == 'csv':
            extractor.export_to_csv()

        elif output_format.lower() == 'all':
            print("Exporting all formats...")
            data = extractor.export_to_json()
            extractor.export_to_csv()

        else:
            print("Error: Unsupported format")
            print("Supported formats: json, csv, all")
            sys.exit(1)

    except Exception as e:
        print(f"Error during extraction: {e}")
        print("\nMake sure:")
        print("1. You have git installed and accessible from command line")
        print("2. The repository path is correct")
        print("3. You have read permissions for the repository")
        sys.exit(1)

    print("\n" + "=" * 55)
    print("✅ EXTRACTION COMPLETE!")

if __name__ == "__main__":
    main()
