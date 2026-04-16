function __fish_proj_pwd_after_wt
    set -l toks (commandline -opc)
    set -l n (count $toks)
    test $n -ge 4
    or return 1
    # After `--wt ` fish often leaves an empty last token; then `--wt` is second-to-last.
    if test $toks[-1] = --wt
        return 0
    end
    test $n -ge 5
    and test $toks[-2] = --wt
end

function __fish_proj_tag_after_tag_id
    set -l t (commandline -opc)
    test (count $t) -eq 3
    and test $t[3] != -d
    and test $t[3] != -p
end

function __fish_proj_fav_after_d
    set -l t (commandline -opc)
    test (count $t) -eq 3
    and test $t[3] = -d
end

function __fish_proj_tag_after_d
    set -l t (commandline -opc)
    test (count $t) -eq 3
    and test $t[3] = -d
end

function __fish_proj_dir_opc3_is_w
    set -l t (commandline -opc)
    test (count $t) -eq 3
    and test $t[3] = -w
end

function __fish_proj_dir_opc3_not_w
    set -l t (commandline -opc)
    test (count $t) -eq 3
    and test $t[3] != -w
end

function __fish_proj_dir_opc4_is_w
    set -l t (commandline -opc)
    test (count $t) -eq 4
    and test $t[4] = -w
end

function __fish_proj_set_opc3_is_d
    set -l t (commandline -opc)
    test (count $t) -eq 3
    and test $t[3] = -d
end

# Third token is first arg after set; offer keys only when it is not a flag prefix.
function __fish_proj_set_opc3_keys
    set -l t (commandline -opc)
    test (count $t) -eq 3
    and test $t[3] != -d
    and not string match -q '-*' $t[3]
end

function __fish_proj_set_opc4_d_project
    set -l t (commandline -opc)
    test (count $t) -eq 4
    and test $t[3] = -d
end

function __fish_proj_set_opc5_d_key
    set -l t (commandline -opc)
    test (count $t) -eq 5
    and test $t[3] = -d
end

function __fish_proj_set_opc4_norm_keys
    set -l t (commandline -opc)
    test (count $t) -eq 4
    and test $t[3] != -d
end

function __fish_proj_tag_opc3_is_p
    set -l t (commandline -opc)
    test (count $t) -eq 3
    and test $t[3] = -p
end

# True when completing after `proj set <proj> <key>` (optional partial `-…` as 5th token), not `proj set -d …`.
function __fish_proj_set_completing_value_or_trailing_delete
    set -l toks (commandline -opc)
    set -l n (count $toks)
    test $toks[1] = proj
    and test $toks[2] = set
    or return 1
    test $toks[3] != -d
    or return 1
    if test $n -eq 4
        return 0
    else if test $n -eq 5
        string match -q -- '-*' "$toks[5]"
        and return 0
    end
    return 1
end

complete -c proj -n '__fish_is_first_token' -a '(proj __complete commands 2>/dev/null)'

# ls
complete -c proj -n '__fish_seen_subcommand_from ls; and test (count (commandline -opc)) -eq 2' -a '--json -f -o -t --grep -h --help'
complete -c proj -n '__fish_seen_subcommand_from ls; and test (count (commandline -opc)) -ge 2' -a '(proj __complete tag-ids 2>/dev/null)'
complete -c proj -n '__fish_seen_subcommand_from ls; and test (count (commandline -opc)) -ge 3' -a '--json -f -o -t --grep'

# dir
complete -c proj -n '__fish_seen_subcommand_from dir; and test (count (commandline -opc)) -eq 2' -a '-w -h --help'
complete -c proj -n '__fish_seen_subcommand_from dir; and test (count (commandline -opc)) -eq 2' -a '(proj __complete workspaces 2>/dev/null)'
complete -c proj -n '__fish_seen_subcommand_from dir; and test (count (commandline -opc)) -eq 2' -k -a '(__fish_complete_directories)'
complete -c proj -n '__fish_seen_subcommand_from dir; and __fish_proj_dir_opc3_is_w' -a '(proj __complete workspaces 2>/dev/null)'
complete -c proj -n '__fish_seen_subcommand_from dir; and __fish_proj_dir_opc3_not_w' -a '-w'
complete -c proj -n '__fish_seen_subcommand_from dir; and __fish_proj_dir_opc4_is_w' -a '(proj __complete workspaces 2>/dev/null)'

# use
complete -c proj -n '__fish_seen_subcommand_from use; and test (count (commandline -opc)) -eq 2' -a '-h --help'
complete -c proj -n '__fish_seen_subcommand_from use; and test (count (commandline -opc)) -eq 2' -a '(proj __complete workspaces 2>/dev/null)'

# completion
complete -c proj -n '__fish_seen_subcommand_from completion; and test (count (commandline -opc)) -eq 2' -a 'bash zsh fish powershell pwsh -h --help'

# editor
complete -c proj -n '__fish_seen_subcommand_from editor; and test (count (commandline -opc)) -eq 2' -a '-h --help'
complete -c proj -n '__fish_seen_subcommand_from editor; and test (count (commandline -opc)) -eq 2' -a '(proj __complete editors 2>/dev/null)'

# new
complete -c proj -n '__fish_seen_subcommand_from new; and test (count (commandline -opc)) -ge 2' -a '--dry-run --force -h --help'
complete -c proj -n '__fish_seen_subcommand_from new; and test (count (commandline -opc)) -ge 2' -k -a '(__fish_complete_directories)'

# clone
complete -c proj -n '__fish_seen_subcommand_from clone; and test (count (commandline -opc)) -eq 2' -a '-h --help'

# verify / tags
complete -c proj -n '__fish_seen_subcommand_from verify tags; and test (count (commandline -opc)) -eq 2' -a '-h --help'

# open
complete -c proj -n '__fish_seen_subcommand_from open; and test (count (commandline -opc)) -eq 2' -a '-h --help'
complete -c proj -n '__fish_seen_subcommand_from open; and test (count (commandline -opc)) -eq 2' -a '(proj __complete projects 2>/dev/null)'
complete -c proj -n '__fish_seen_subcommand_from open; and test (count (commandline -opc)) -eq 3' -a '(proj __complete editors 2>/dev/null)'
complete -c proj -n '__fish_seen_subcommand_from open; and test (count (commandline -opc)) -eq 3' -a '-r --root --wt -p --project -h --help'

# pwd
complete -c proj -n '__fish_seen_subcommand_from pwd; and test (count (commandline -opc)) -eq 2' -a '-h --help'
complete -c proj -n '__fish_seen_subcommand_from pwd; and test (count (commandline -opc)) -eq 2' -a '(proj __complete projects 2>/dev/null)'
complete -c proj -n '__fish_seen_subcommand_from pwd; and test (count (commandline -opc)) -eq 3' -a '-r --root --wt -p --project -h --help'
complete -c proj -n '__fish_seen_subcommand_from pwd; and __fish_proj_pwd_after_wt' -a main

# wt
complete -c proj -n '__fish_seen_subcommand_from wt; and test (count (commandline -opc)) -eq 2' -a '-h --help'
complete -c proj -n '__fish_seen_subcommand_from wt; and test (count (commandline -opc)) -eq 2' -a '(proj __complete projects 2>/dev/null)'
complete -c proj -n '__fish_seen_subcommand_from wt; and test (count (commandline -opc)) -eq 4' -a '-b -h --help'

# tag
complete -c proj -n '__fish_seen_subcommand_from tag; and test (count (commandline -opc)) -eq 2' -a '-d -p -h --help'
complete -c proj -n '__fish_seen_subcommand_from tag; and __fish_proj_tag_after_tag_id' -a '-d -p'
complete -c proj -n '__fish_seen_subcommand_from tag; and __fish_proj_tag_opc3_is_p' -a '(proj __complete projects 2>/dev/null)'
complete -c proj -n '__fish_seen_subcommand_from tag; and __fish_proj_tag_after_d' -a '-p -h --help'
complete -c proj -n '__fish_seen_subcommand_from tag; and __fish_proj_tag_after_d' -a '(proj __complete tag-ids 2>/dev/null)'
complete -c proj -n '__fish_seen_subcommand_from tag; and test (count (commandline -opc)) -eq 4; and contains -- -p (commandline -opc)' -a '(proj __complete projects 2>/dev/null)'
complete -c proj -n '__fish_seen_subcommand_from tag; and test (count (commandline -opc)) -eq 5; and contains -- -p (commandline -opc)' -a '(proj __complete projects 2>/dev/null)'

# status / rm
complete -c proj -n '__fish_seen_subcommand_from status; and test (count (commandline -opc)) -eq 2' -a '--json -h --help'
complete -c proj -n '__fish_seen_subcommand_from status; and test (count (commandline -opc)) -eq 2' -a '(proj __complete projects 2>/dev/null)'
complete -c proj -n '__fish_seen_subcommand_from rm; and test (count (commandline -opc)) -eq 2' -a '-f --force -h --help'
complete -c proj -n '__fish_seen_subcommand_from rm; and test (count (commandline -opc)) -eq 2' -a '(proj __complete projects 2>/dev/null)'

# set
complete -c proj -n '__fish_seen_subcommand_from set; and test (count (commandline -opc)) -eq 2' -a '-d -h --help'
complete -c proj -n '__fish_seen_subcommand_from set; and test (count (commandline -opc)) -eq 2' -a '(proj __complete projects 2>/dev/null)'
complete -c proj -n '__fish_seen_subcommand_from set; and __fish_proj_set_opc3_is_d' -a '(proj __complete projects 2>/dev/null)'
complete -c proj -n '__fish_seen_subcommand_from set; and __fish_proj_set_opc4_d_project' -a '(proj __complete projects 2>/dev/null)'
complete -c proj -n '__fish_seen_subcommand_from set; and __fish_proj_set_opc5_d_key' -a '(proj __complete projrc-keys 2>/dev/null)'
complete -c proj -n '__fish_seen_subcommand_from set; and __fish_proj_set_opc3_keys' -a '(proj __complete projrc-keys 2>/dev/null)'
complete -c proj -n '__fish_seen_subcommand_from set; and __fish_proj_set_opc4_norm_keys' -a '(proj __complete projrc-keys 2>/dev/null)'
complete -c proj -n '__fish_seen_subcommand_from set; and __fish_proj_set_completing_value_or_trailing_delete' -a '-d'

# get
complete -c proj -n '__fish_seen_subcommand_from get; and test (count (commandline -opc)) -eq 2' -a '-h --help'
complete -c proj -n '__fish_seen_subcommand_from get; and test (count (commandline -opc)) -eq 2' -a '(proj __complete projects 2>/dev/null)'
complete -c proj -n '__fish_seen_subcommand_from get; and test (count (commandline -opc)) -eq 3' -a '(proj __complete projrc-keys 2>/dev/null)'

# mv
complete -c proj -n '__fish_seen_subcommand_from mv; and test (count (commandline -opc)) -eq 2' -a '-h --help'
complete -c proj -n '__fish_seen_subcommand_from mv; and test (count (commandline -opc)) -eq 2' -a '(proj __complete projects 2>/dev/null)'
complete -c proj -n '__fish_seen_subcommand_from mv; and test (count (commandline -opc)) -eq 3' -a '-h --help'
complete -c proj -n '__fish_seen_subcommand_from mv; and test (count (commandline -opc)) -eq 3' -a '(proj __complete projects 2>/dev/null)'

# fav
complete -c proj -n '__fish_seen_subcommand_from fav; and test (count (commandline -opc)) -eq 2' -a '-d -h --help'
complete -c proj -n '__fish_seen_subcommand_from fav; and test (count (commandline -opc)) -eq 2' -a '(proj __complete projects 2>/dev/null)'
complete -c proj -n '__fish_seen_subcommand_from fav; and __fish_proj_fav_after_d' -a '(proj __complete fav-names 2>/dev/null)'
